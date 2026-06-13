
# 🧬 MSATransformer: Deep Learning-Based Sequence-to-Sequence Architecture for Nucleic Acid Multiple Sequence Alignment

[![Framework: PyTorch](https://img.shields.io/badge/Framework-PyTorch-ee4c2c?logo=pytorch)](https://pytorch.org) 
[![Academic: Thesis](https://img.shields.io/badge/Academic-Skripsi%202026-blue)](http://uinjkt.ac.id)

This is the main repository of **MSATransformer**, an end-to-end deep learning framework that reformulates the Multiple Sequence Alignment (MSA) problem from a traditional heuristic-based optimization into an autoregressive **Sequence-to-Sequence (S2S) translation task**. 

This codebase contains the complete production-ready system, integrating the PyTorch neural network backbone, a high-performance FastAPI inference engine, and an interactive Next.js web application matrix visualization.

> 🔄 **Note on Training:** This repository contains the architecture definition and operational inference product. To replicate the training loops, access dataset generation pipelines, or retrain the model weights, please visit the dedicated training code repository: [msa-transformer-nuc](https://github.com/TanjungArs/msa-transformer-nuc).

---

## 🔬 Research Motivation & Theoretical Framework

Finding mathematically optimal MSAs under traditional scoring schemes (such as Sum-of-Pairs) is an **NP-complete** problem. Consequently, industry-standard alignment tools rely on heuristic approximations or progressive guide-trees, which are prone to permanent error propagation from early alignment stages and depend on rigid, static substitution matrices.

### The Sequence-as-Language Paradigm
This research approaches biological sequences through a linguistic lens, mapping nucleotides to basic characters and evolutionary conservation rules to syntax or grammar. By implementing a **Transformer architecture powered by Multi-Head Self-Attention**, MSATransformer implicitly learns non-linear evolutionary dynamics and long-range contextual dependencies directly from mass data.

Instead of optimizing an alignment mathematically based on fixed gap penalties, the model treats alignment as a translation problem—"translating" unaligned sequence blocks into structurally aligned nucleotide configurations complete with optimal gap placements.

<br>

## ⚙️ Core Architecture & Multi-Task Learning

MSATransformer leverages a customized multi-task learning layout utilizing a shared global encoder paired with **two separate decoupled decoders** implemented in PyTorch:

1. **Align Decoder:** Predicts the actual nucleotide tokens (`A`, `T`, `C`, `G`) and evolutionary gap characters (`-`) inside the alignment matrix.
2. **Gap Decoder:** Specializes in tracking structural insertion and deletion (indel) boundaries by modeling gap topologies exclusively (`~` vs `#`), reinforcing structural awareness.

<br>

```
              [ Raw Sequences Input ] (Concatenated with '|')
                         │
                         ▼
          [ Sinusoidal Positional Encoding ]
                         │
                         ▼
             [ Multi-Head Encoder ]
                         │
        ┌────────────────┴────────────────┐
        ▼ (Shared Context Representation) ▼

 [ Align Decoder ]                 [ Gap Decoder ]
        │                                 │
        ▼                                 ▼

Logits Align Output               Logits Gap Output
(Nucleotide Assignment)          (Indel Boundary Map)

```

### Joint Objective Optimization
The total optimization function integrates loss profiles from both prediction paths concurrently during training:

$$L_{total} = L_{align} + L_{gap}$$


Where both components represent multi-class **Cross-Entropy Loss**, masking out standard padding matrices (`ignore_index`) during backward propagation to guarantee gradient stability.

<br> <br>

## 📊 Core Deployment & Inference Pipeline

The main engine orchestrates data across a decoupled, modern stack to serve real-time predictions:

1. **Input Transformation:** Raw variable-length nucleotide strings are read from FASTA formats or parsed from the web controller into a unified concatenated context array separated by token boundaries (`|`).

2. **Contextual Encoding:** The multi-head encoder maps global structural relations across all unaligned strands simultaneously.

3. **Autoregressive Decoding:** Runs strictly under a `@torch.no_grad()` footprint. The Align Decoder dynamically evaluates output probabilities via `argmax` distributions position by position, feeding predicted tokens back into the next sequence step until an `<EOS>` block settles.

4. **API Interface:** A **FastAPI** worker loads the targeted model weights and communicates over a proxy layer with the **Next.js App Router** frontend to serve interactive color-coded alignment visuals.

<br><br>

## 🛠️ Installation & Setup Guide

### Prerequisites
* Python 3.10+
* Node.js (v18 or higher)
* PNPM package manager

### 1. Backend Setup (PyTorch & FastAPI)
Navigate to the backend directory, initialize a python virtual environment, and install the computation dependencies:

```bash
cd backend

# Create and activate python environment
python -m venv venv
source venv/bin/activate # On Windows use `venv\Scripts\activate`

# Install core tensor core, api engine, and data science utilities
pip install torch --index-url [https://download.pytorch.org/whl/cu118]

pip install fastapi uvicorn numpy

```

To boot the backend server:

```bash
python -m uvicorn main:app
```

### 2. Frontend Setup (Next.js Application)

Open a new terminal window, navigate to the frontend directory, install web modules using pnpm, and launch the dashboard application:

```bash
cd frontend

# Install UI and structural modules
pnpm install

# Run the development environment local proxy
pnpm dev

```
<br>

## 📈 Evaluation Metrics & Performance Benchmarks

The system assesses alignment quality through standard quantitative metrics in computational biology:

* **Sum-of-Pairs (SP Score):** Measures pairwise alignment quality by accumulating similarity scores column by column.
* **Column Score (CS Score):** Evaluates absolute sequence conservation accuracy by calculating the percentage of identical positions across all rows.

### Empirical Summary Against Classical Baselines

Tested across large-scale independent test sets generated through evolutionary simulations, the deep learning model shows highly competitive results against standard heuristic utilities (MAFFT, Clustal Omega, and MUSCLE):

* **Optimized Error Correction:** The model consistently outperforms the original simulator data references (`SpartaABC`) on both SP and CS metrics, proving it successfully optimizes and cleans up structural noise from its initial source data.

* **Industrial-Grade Scalability:** Under higher-complexity environments with multi-sequence arrays, MSATransformer matches or exceeds the pairwise alignment accuracy (`Avg SP`) of industry-standard tools like `MAFFT`.

* **Efficient Gap Topology:** By evaluating joint indel boundaries, the model places structural gaps more cleanly, leading to fewer unnecessary structural fragmentation flags compared to traditional heuristic progressive alignments.
