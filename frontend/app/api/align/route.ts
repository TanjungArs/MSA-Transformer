import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method = 0 } = body;

    // PRESET ALIGNMENT 
    const alignment = [
      {
        name: "DM165465",
        sequence: "TGTGGATCCTCCTC-CTA-------GGCTTCCAAAATCCCA-",
      },
      {
        name: "PD223217",
        sequence: "-GTTAATACGACTCACTATAGGGCCGTCTTTCAATATGCTGA",
      },
      {
        name: "PD223215",
        sequence: "-GTTAATACGACTCACTATAGGGACGCCTTTCAATATGCTG-",
      },
    ];

    // hitung gap total
    let totalGaps = 0;
    for (const seq of alignment) {
      totalGaps += (seq.sequence.match(/-/g) || []).length;
    }

    const alignmentLength = alignment[0].sequence.length;

    return NextResponse.json({
      success: true,
      result: {
        alignedSequences: alignment,
        identityScore: 99, // fixed dummy score
        spScore: 213,       // fixed dummy score
        totalGaps,
        sequenceCount: alignment.length,
        alignmentLength,
        method: method === 0 ? "transformer (preset)" : "preset",
        methodId: method,
        metrics: {
          sp: 213,
          cs: 99,
          gaps: 21,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to return preset alignment" },
      { status: 500 }
    );
  }
}