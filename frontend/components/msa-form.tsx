'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Dna, Loader2, Copy, Check, RotateCcw, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AlignmentResult {
  alignedSequences: { name: string; sequence: string }[];
  identityScore: number;
  spScore: number;
  totalGaps: number;
  sequenceCount: number;
  alignmentLength: number;
  method?: string;
  methodId?: number;
  originalHeaders?: string[];
}

// Color coding for nucleotides
const getResidueColor = (char: string): string => {
  const upperChar = char.toUpperCase();
  
  if (upperChar === 'A') return 'bg-green-200 text-green-800';
  if (upperChar === 'T' || upperChar === 'U') return 'bg-red-200 text-red-800';
  if (upperChar === 'G') return 'bg-yellow-200 text-yellow-800';
  if (upperChar === 'C') return 'bg-blue-200 text-blue-800';
  if (upperChar === '-') return 'bg-gray-100 text-gray-400';
  
  return 'bg-gray-200 text-gray-800';
};

const METHODS = [
  { id: 0, name: 'Transformer', label: 'T' },
  { id: 1, name: 'MAFFT', label: 'M' },
  { id: 2, name: 'Clustal Omega', label: 'C' },
  { id: 3, name: 'MUSCLE', label: 'U' },
];

export default function MSAForm() {
  const [textInput, setTextInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AlignmentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  // Parse FASTA headers from input
  const parseHeaders = (fasta: string): string[] => {
    const lines = fasta.split('\n');
    const headers: string[] = [];
    for (const line of lines) {
      if (line.startsWith('>')) {
        headers.push(line.substring(1));
      }
    }
    return headers;
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setTextInput(content);
        setError('');
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(file);
    }
  }, []);

  const handleSubmit = async () => {
    if (!textInput.trim()) {
      setError('Please enter sequences or upload a file');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/align', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fasta: textInput,
          method: selectedMethod 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Alignment failed');
      }

      setResult({
        ...data.result,
        originalHeaders: parseHeaders(textInput),
      });

      // Auto scroll ke hasil
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTextInput('');
    setFileName('');
    setResult(null);
    setError('');
  };

  const copyToClipboard = async () => {
    if (!result) return;
    
    let text = '';
    for (let i = 0; i < result.alignedSequences.length; i++) {
      const header = result.originalHeaders?.[i] || result.alignedSequences[i].name;
      text += `>${header}\n${result.alignedSequences[i].sequence}\n`;
    }
    
    await navigator.clipboard.writeText(text);
    setCopyMessage('Copied to Clipboard!');
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setCopyMessage('');
    }, 2000);
  };

  const downloadFasta = () => {
    if (!result) return;
    
    let text = '';
    for (let i = 0; i < result.alignedSequences.length; i++) {
      const header = result.originalHeaders?.[i] || result.alignedSequences[i].name;
      text += `>${header}\n${result.alignedSequences[i].sequence}\n`;
    }
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', 'alignment.fasta');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exampleSequences = `>DM165465
TGTGGATCCTCCTCCTAGGCTTCCAAAATCCCA
>PD223217
GTTAATACGACTCACTATAGGGCCGTCTTTCAATATGCTGA
>PD223215
GTTAATACGACTCACTATAGGGACGCCTTTCAATATGCTG`;

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <Card className="border-2 border-primary">
        <CardHeader className="border-b-2 border-primary bg-card">
          <CardTitle className="text-xl font-bold uppercase tracking-wide text-primary">
            Step 1: Input Sequences
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Method Selector */}
          <div className="mb-6 flex items-center gap-3">
            <label className="text-sm font-semibold text-muted-foreground uppercase">Method:</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(parseInt(e.target.value))}
              className="px-3 py-2 text-sm border-2 border-primary rounded-lg bg-card text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4 p-3 border-2 border-accent bg-accent/10 rounded-lg text-sm text-accent font-semibold">
            Demo Mode: Input manual disabled. Use sample dataset only.
          </div>
          <div className="fixed top-2 right-2 z-10">
           <span className="text-xs font-bold uppercase tracking-widest bg-accent text-accent-foreground px-2 py-1 rounded">
              Demo Only
            </span>
          </div>     
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Text Input */}

            <div className="space-y-4 lg:col-span-2">
            <p className="text-sm text-muted-foreground font-semibold">Text Input</p>

              <textarea
                value={textInput}
                readOnly
                className="w-full h-48 p-4 font-mono text-sm border-2 border-primary rounded-lg bg-muted/40 text-muted-foreground resize-none cursor-not-allowed"
                placeholder="This input is disabled. Please use 'Load Example' to generate demo sequences."
              />
            </div>



            {/* File Upload */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-semibold"><span className="text-xs font-normal">or</span> Upload FASTA File</p>
              <div className="border-2 border-dashed border-primary rounded-lg p-6 h-48 flex flex-col items-center justify-center opacity-60 pointer-events-none">                <input
                  type="file"
                  id="file-upload"
                  disabled
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3 w-full h-full justify-center"
                >
                  <div className="p-3 rounded-full bg-secondary">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="font-semibold text-primary text-sm">Click to upload</span>
                    <span className="text-muted-foreground text-xs"> or drag and drop</span>
                  </div>
                </label>
              </div>
              {fileName && (
                <div className="p-3 bg-accent/10 border-2 border-accent rounded-lg flex items-center gap-3">
                  <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-accent truncate">{fileName}</p>
                    <p className="text-xs text-accent/70">Ready for alignment</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border-2 border-destructive rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 justify-between flex-wrap">
            <div className="flex gap-3">
              {textInput ? (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-2 border-primary"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setTextInput(exampleSequences)}
                >
                  Load Example
                </Button>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !textInput.trim()}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-wide"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Aligning...
                </>
              ) : (
                <>
                  <Dna className="h-4 w-4 mr-2" />
                  Run Alignment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div ref={resultRef}>
          <Card className="border-2 border-primary">
            <CardHeader className="border-b-2 border-primary bg-card">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-xl font-bold uppercase tracking-wide text-primary">
                    Step 2: Alignment Results
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Method: {METHODS.find(m => m.id === selectedMethod)?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadFasta}
                    className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  {copyMessage && (
                    <div className="flex items-center gap-2 text-sm text-accent font-medium">
                      <AlertCircle className="h-4 w-4" />
                      {copyMessage}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="border-2 border-primary rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Sequences</p>
                  <p className="text-2xl font-bold text-primary mt-2">{result.sequenceCount}</p>
                </div>
                <div className="border-2 border-primary rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Length</p>
                  <p className="text-2xl font-bold text-primary mt-2">{result.alignmentLength}</p>
                </div>
                <div className="border-2 border-accent rounded-lg p-4 text-center bg-accent/10">
                  <p className="text-xs text-accent uppercase tracking-widest font-semibold">CS Score</p>
                  <p className="text-2xl font-bold text-accent mt-2">{result.identityScore.toFixed(2)}</p>
                </div>
                <div className="border-2 border-accent rounded-lg p-4 text-center bg-accent/10">
                  <p className="text-xs text-accent uppercase tracking-widest font-semibold">SP Score</p>
                  <p className="text-2xl font-bold text-accent mt-2">{result.spScore.toFixed(2)}</p>
                </div>
                <div className="border-2 border-primary rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Gaps</p>
                  <p className="text-2xl font-bold text-primary mt-2">{result.totalGaps}</p>
                </div>
              </div>

              {/* Alignment Display */}
              <div className="border-2 border-primary rounded-lg overflow-hidden">
                <div className="bg-secondary p-3 border-b-2 border-primary">
                  <h3 className="font-bold text-primary uppercase text-sm tracking-wide">
                    Aligned Sequences
                  </h3>
                </div>
                <div className="overflow-x-auto bg-card">
                  <div className="min-w-full p-4">
                    <div className="mb-4 p-3 space-y-1">
                      {result.alignedSequences.map((seq, idx) => (
                        <div key={idx} className="flex">
                          <div className="mb-4 p-3 space-y-1 min-w-48 pr-4 py-2 border-r-2 border-primary bg-secondary/50">
                            <span className="font-mono text-xs font-semibold text-primary truncate block">
                              {seq.name}
                            </span>
                          </div>
                          <div className="font-mono text-xs flex gap-0 py-2 px-2">
                            {seq.sequence.split('').map((char, charIdx) => (
                              <span
                                key={charIdx}
                                className={`w-6 h-7 flex items-center justify-center font-bold border border-primary/20 ${getResidueColor(char)}`}
                              >
                                {char}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Legend */}
              <div className="mt-6 border-2 border-primary rounded-lg p-4">
                <h4 className="font-bold text-primary uppercase text-sm tracking-wide mb-3">
                  Color Legend
                </h4>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-green-200 text-green-800 font-bold">A</span>
                    <span className="text-muted-foreground">Adenine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-red-200 text-red-800 font-bold">T</span>
                    <span className="text-muted-foreground">Thymine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-yellow-200 text-yellow-800 font-bold">G</span>
                    <span className="text-muted-foreground">Guanine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-blue-200 text-blue-800 font-bold">C</span>
                    <span className="text-muted-foreground">Cytosine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-gray-100 text-gray-400 font-bold">-</span>
                    <span className="text-muted-foreground">Gap</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
