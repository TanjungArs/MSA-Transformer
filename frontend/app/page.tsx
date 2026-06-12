import { Dna } from 'lucide-react';
import MSAForm from '@/components/msa-form';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-primary bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary">
              <Dna className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-primary">
                MSA Transformer
              </h1>
              <p className="text-sm text-muted-foreground">
                Multiple Sequence Alignment
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-muted-foreground leading-relaxed">
            Upload a FASTA file or paste FASTA-formatted DNA sequences into the input field. 
            The system accepts DNA sequences containing only nucleotide characters (A, T, C, and G). 
            After submission, the predicted alignment and evaluation metrics will be displayed.
          </p>
        </div>

        <MSAForm />

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t-2 border-primary/20">
          <p className="text-sm text-muted-foreground text-center">
            This tool uses a Transformer-based deep learning model for multiple sequence
            alignment of DNA sequences. Alternative methods (MAFFT, Clustal Omega, MUSCLE) are available.
          </p>
        </footer>
      </div>
    </main>
  );
}
