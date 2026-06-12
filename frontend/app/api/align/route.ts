import { NextRequest, NextResponse } from 'next/server';

// URL ke backend Python MSA Transformer
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fasta, method = 0 } = body;

    if (!fasta || typeof fasta !== 'string' || fasta.trim() === '') {
      return NextResponse.json(
        { error: 'No sequences provided' },
        { status: 400 }
      );
    }

    // Forward request ke Python backend
    console.log('[v0] Sending request to Python backend:', PYTHON_BACKEND_URL);
    console.log('[v0] Method:', method);
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        fasta: fasta.trim(),
        method: parseInt(String(method)) || 0 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[v0] Python backend error:', data);
      return NextResponse.json(
        { error: data.error || 'Alignment failed' },
        { status: response.status }
      );
    }

    console.log('[v0] Alignment successful');

    // Transform Python backend response untuk frontend
    if (data.success) {
      // Calculate total gaps
      const alignmentLength = data.alignment[0]?.length || 0;
      let totalGaps = 0;
      for (const seq of data.alignment) {
        totalGaps += (seq.match(/-/g) || []).length;
      }

      return NextResponse.json({
        success: true,
        result: {
          alignedSequences: data.alignment.map((seq: string, idx: number) => ({
            name: `Sequence_${idx + 1}`,
            sequence: seq,
          })),
          identityScore: data.metrics?.cs || 0,
          spScore: data.metrics?.sp || 0,
          totalGaps: totalGaps,
          sequenceCount: data.n_sequences,
          alignmentLength: alignmentLength,
          method: data.method,
          methodId: data.method_id,
          metrics: data.metrics,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Alignment error:', error);
    
    if (error instanceof Error && error.message.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'Cannot connect to backend. Please ensure Python backend is running.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during alignment processing' },
      { status: 500 }
    );
  }
}
