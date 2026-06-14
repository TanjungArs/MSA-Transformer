import os
import sys
import torch
import traceback
import tempfile
import subprocess

from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from src.tokenizer import AlignTokenizer, GapTokenizer
from src.model.msa_transformer import MSATransformer

from pymsa.core.msa import MSA
from pymsa.core.score import SumOfPairs, PercentageOfNonGaps



# FASTAPI
app = FastAPI(
    title="MSA Transformer API",
    version="1.0.0",
    description="Multiple Sequence Alignment using Transformer"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"[INFO] DEVICE: {DEVICE}")



# TOKENIZER
align_tok = AlignTokenizer()
gap_tok = GapTokenizer()



# FASTA UTILS
class PredictRequest(BaseModel):
    fasta: str
    method: int = 0

def read_fasta_text(text):
    seqs = []
    current = ""

    for line in text.splitlines():
        line = line.strip()

        if line.startswith(">"):
            if current:
                seqs.append(current.upper())
            current = ""
        else:
            current += line

    if current:
        seqs.append(current.upper())

    return seqs

def to_concat(seqs):
    return "|".join(seqs)

def to_fasta(seqs):
    lines = []
    for i, s in enumerate(seqs, 1):
        lines.append(f">seq{i}")
        lines.append(s)
    return "\n".join(lines)

def from_flattened(flat_str, n_seqs):
    seqs = [""] * n_seqs

    for i, c in enumerate(flat_str):
        seqs[i % n_seqs] += c

    return seqs



# METRICS
def compute_metrics(seqs):
    seqs = [s.upper() for s in seqs]

    max_len = max(len(s) for s in seqs)
    seqs = [s.ljust(max_len, '-') for s in seqs]

    msa = MSA(seqs)

    sp = SumOfPairs(msa).compute()
    cs = PercentageOfNonGaps(msa).compute()

    gaps = sum(s.count("-") for s in seqs)

    return {
        "sp": round(sp, 4),
        "cs": round(cs, 4),
        "gaps": gaps
    }


# EXTERNAL ALIGNMENT TOOLS
def run_mafft(inp, out):

    subprocess.run(
        f"mafft --auto {inp} > {out}",
        shell=True,
        check=True
    )


def run_clustalo(inp, out):

    subprocess.run(
        f"clustalo -i {inp} -o {out} --force",
        shell=True,
        check=True
    )


def run_muscle(inp, out):

    subprocess.run(
        f"muscle -align {inp} -output {out}",
        shell=True,
        check=True
    )


def read_alignment_file(path):

    return read_fasta_text(
        open(path).read()
    )


def run_external_alignment(seqs, method):

    with tempfile.TemporaryDirectory() as tmpdir:

        inp = os.path.join(tmpdir, "input.fasta")
        out = os.path.join(tmpdir, "output.fasta")

        with open(inp, "w") as f:
            f.write(to_fasta(seqs))

        if method == 1:

            print("[INFO] Running MAFFT")

            run_mafft(inp, out)

        elif method == 2:

            print("[INFO] Running Clustal Omega")

            run_clustalo(inp, out)

        elif method == 3:

            print("[INFO] Running MUSCLE")

            run_muscle(inp, out)

        return read_alignment_file(out)


# LOAD MODEL
MODELS = {}

def load_model(n_seq):

    model_path = os.path.join(BASE_DIR, "model", f"{n_seq}-seq.pt")

    print(f"[INFO] Loading {model_path}")

    ckpt = torch.load(model_path, map_location=DEVICE)

    cfg = ckpt["model_cfg"]

    model = MSATransformer(
        align_vocab_size=len(align_tok.vocab),
        gap_vocab_size=len(gap_tok.vocab),
        dim=cfg["dim"],
        enc_depth=cfg["enc_depth"],
        dec_depth=cfg["dec_depth"],
        n_heads=cfg["n_heads"],
        ff_dim=cfg["ff_dim"],
        dropout=cfg["dropout"],
        max_len=cfg["max_len"],
        align_pad_id=align_tok.pad_id,
        gap_pad_id=gap_tok.pad_id
    ).to(DEVICE)

    model.load_state_dict(ckpt["model"])
    model.eval()

    return model

# LOAD MODELS PYTORCH
for n in [2, 3, 4, 5]:
    try:
        MODELS[n] = load_model(n)
    except Exception as e:
        print(f"[Error] Failed to load model {n} : {e}")


# INFERENCE
@torch.no_grad()
def infer(model, tokenizer, unalign, device, max_len=1024):

    input_ids = torch.tensor(
        tokenizer.encode(unalign, add_eos=False),
        device=device
    ).unsqueeze(0)

    key_padding_mask = (input_ids == tokenizer.pad_id)

    encoder_out = model.encoder(
        input_ids,
        key_padding_mask
    )

    decoder_input = torch.tensor(
        [[tokenizer.sos_id]],
        device=device
    )

    for _ in range(max_len):

        logits = model.decoder_align(
            encoder_out=encoder_out,
            decoder_input=decoder_input,
            enc_padding_mask=key_padding_mask
        )

        next_tok = logits[:, -1].argmax(-1, keepdim=True)

        decoder_input = torch.cat(
            [decoder_input, next_tok],
            dim=1
        )

        if next_tok.item() == tokenizer.eos_id:
            break

    return tokenizer.decode(
        decoder_input[0].tolist()
    )



# ROUTES
VALID_CHARS = set("ATCG")
MAX_SEQ_LEN = 1024
MIN_SEQ = 2
MAX_SEQ = 5

METHOD_NAMES = {
    0: "transformer",
    1: "mafft",
    2: "clustalo",
    3: "muscle"
}

@app.get("/")
def home():
    return FileResponse("index.html")


@app.post("/predict")
async def predict(req: PredictRequest):

    try:

        text = req.fasta
        method = int(req.method)

        seqs = read_fasta_text(text)
        
        if method not in METHOD_NAMES:
            method = 0

        n_seqs = len(seqs)
        for seq_idx, seq in enumerate(seqs, start=1):

            if not seq:
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": f"Sequence {seq_idx} is empty"
                    }
                )

            if len(seq) > MAX_SEQ_LEN:
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": (
                            f"Sequence {seq_idx} is too long "
                            f"({len(seq)} > {MAX_SEQ_LEN})"
                        )
                    }
                )

            for col_idx, char in enumerate(seq.upper(), start=1):

                if char not in VALID_CHARS:
                    return JSONResponse(
                        status_code=400,
                        content={
                            "error": (
                                f"Invalid character '{char}' "
                                f"in sequence {seq_idx}, "
                                f"at position {col_idx}"
                            )
                        }
                    )
        
        if n_seqs < MIN_SEQ:
            return JSONResponse(
                status_code=400,
                content={
                    "error": f"At least {MIN_SEQ} sequences are required"
                }
            )
        elif n_seqs > MAX_SEQ:
            return JSONResponse(
                status_code=400,
                content={
                    "error": f"Maximum {MAX_SEQ} sequences are allowed"
                }
            )
           
            
        if n_seqs not in MODELS:
            return JSONResponse(
                status_code=500,
                content={
                    "error": f"Model for {n_seqs} is not available"
                }
            )
        
        if method == 0:
            model = MODELS[n_seqs]

            print(f"[INFO] Infer {n_seqs} sequence")

            unalign = to_concat(seqs)

            pred_flat = infer(
                model,
                align_tok,
                unalign,
                DEVICE
            )

            aligned = from_flattened(
                pred_flat,
                n_seqs
            )
        else:
            aligned = run_external_alignment(
                seqs,
                method
            )

        metrics = compute_metrics(
            aligned
        )

        return {
            "success": True,
            "method": METHOD_NAMES[method],
            "method_id": method,
            "n_sequences": n_seqs,
            "alignment": aligned,
            "metrics": metrics
        }

    except Exception as e:

        traceback.print_exc()

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )