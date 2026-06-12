// Multiple Sequence Alignment using Progressive Alignment with Needleman-Wunsch

interface AlignmentResult {
  alignedSequences: { name: string; sequence: string }[];
  consensusSequence: string;
  identityScore: number;
}

// Scoring parameters
const MATCH = 2;
const MISMATCH = -1;
const GAP = -2;

// Parse FASTA format
export function parseFasta(input: string): { name: string; sequence: string }[] {
  const sequences: { name: string; sequence: string }[] = [];
  const lines = input.trim().split('\n');

  let currentName = '';
  let currentSequence = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('>')) {
      if (currentName && currentSequence) {
        sequences.push({ name: currentName, sequence: currentSequence.toUpperCase() });
      }
      currentName = trimmedLine.substring(1).trim() || `Sequence_${sequences.length + 1}`;
      currentSequence = '';
    } else if (trimmedLine) {
      currentSequence += trimmedLine.replace(/\s/g, '');
    }
  }

  if (currentName && currentSequence) {
    sequences.push({ name: currentName, sequence: currentSequence.toUpperCase() });
  }

  // If no FASTA headers found, treat each non-empty line as a sequence
  if (sequences.length === 0) {
    const rawSequences = input
      .split('\n')
      .map((l) => l.trim().replace(/\s/g, ''))
      .filter((l) => l.length > 0);
    rawSequences.forEach((seq, idx) => {
      sequences.push({ name: `Sequence_${idx + 1}`, sequence: seq.toUpperCase() });
    });
  }

  return sequences;
}

// Needleman-Wunsch pairwise alignment
function needlemanWunsch(
  seq1: string,
  seq2: string
): { aligned1: string; aligned2: string; score: number } {
  const m = seq1.length;
  const n = seq2.length;

  // Initialize scoring matrix
  const score: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) score[i][0] = i * GAP;
  for (let j = 0; j <= n; j++) score[0][j] = j * GAP;

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const match = score[i - 1][j - 1] + (seq1[i - 1] === seq2[j - 1] ? MATCH : MISMATCH);
      const deleteGap = score[i - 1][j] + GAP;
      const insertGap = score[i][j - 1] + GAP;
      score[i][j] = Math.max(match, deleteGap, insertGap);
    }
  }

  // Traceback
  let aligned1 = '';
  let aligned2 = '';
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && score[i][j] === score[i - 1][j - 1] + (seq1[i - 1] === seq2[j - 1] ? MATCH : MISMATCH)) {
      aligned1 = seq1[i - 1] + aligned1;
      aligned2 = seq2[j - 1] + aligned2;
      i--;
      j--;
    } else if (i > 0 && score[i][j] === score[i - 1][j] + GAP) {
      aligned1 = seq1[i - 1] + aligned1;
      aligned2 = '-' + aligned2;
      i--;
    } else {
      aligned1 = '-' + aligned1;
      aligned2 = seq2[j - 1] + aligned2;
      j--;
    }
  }

  return { aligned1, aligned2, score: score[m][n] };
}

// Add gaps to a sequence based on a profile
function addGapsToSequence(seq: string, gappedRef: string, originalRef: string): string {
  let result = '';
  let seqIdx = 0;
  let refIdx = 0;

  for (let i = 0; i < gappedRef.length; i++) {
    if (gappedRef[i] === '-') {
      result += '-';
    } else {
      // Find position in original sequence
      while (refIdx < originalRef.length && originalRef[refIdx] !== gappedRef[i]) {
        refIdx++;
      }
      if (seqIdx < seq.length) {
        result += seq[seqIdx];
        seqIdx++;
      } else {
        result += '-';
      }
      refIdx++;
    }
  }

  // Add remaining characters
  while (seqIdx < seq.length) {
    result += seq[seqIdx];
    seqIdx++;
  }

  return result;
}

// Align a new sequence to a profile (represented by first aligned sequence)
function alignToProfile(
  profile: string[],
  newSeq: string
): string[] {
  // Use the first sequence of the profile as representative
  const representative = profile[0].replace(/-/g, '');
  const { aligned1, aligned2 } = needlemanWunsch(representative, newSeq);

  // Update all sequences in the profile to match new alignment
  const updatedProfile: string[] = [];
  
  for (const seq of profile) {
    let newAligned = '';
    let seqIdx = 0;
    
    for (let i = 0; i < aligned1.length; i++) {
      if (aligned1[i] === '-') {
        newAligned += '-';
      } else {
        // Find next non-gap character in original aligned sequence
        while (seqIdx < seq.length && seq[seqIdx] === '-') {
          newAligned += '-';
          seqIdx++;
        }
        if (seqIdx < seq.length) {
          newAligned += seq[seqIdx];
          seqIdx++;
        }
      }
    }
    
    // Add any remaining gaps
    while (seqIdx < seq.length) {
      newAligned += seq[seqIdx];
      seqIdx++;
    }
    
    updatedProfile.push(newAligned);
  }

  updatedProfile.push(aligned2);
  
  // Ensure all sequences have the same length
  const maxLen = Math.max(...updatedProfile.map(s => s.length));
  return updatedProfile.map(s => s.padEnd(maxLen, '-'));
}

// Calculate consensus sequence
function calculateConsensus(alignedSeqs: string[]): string {
  if (alignedSeqs.length === 0) return '';

  const length = alignedSeqs[0].length;
  let consensus = '';

  for (let i = 0; i < length; i++) {
    const counts: { [key: string]: number } = {};

    for (const seq of alignedSeqs) {
      const char = seq[i] || '-';
      if (char !== '-') {
        counts[char] = (counts[char] || 0) + 1;
      }
    }

    if (Object.keys(counts).length === 0) {
      consensus += '-';
    } else {
      const maxChar = Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
      consensus += maxChar;
    }
  }

  return consensus;
}

// Calculate identity score
function calculateIdentity(alignedSeqs: string[]): number {
  if (alignedSeqs.length < 2) return 100;

  const length = alignedSeqs[0].length;
  let identicalPositions = 0;
  let comparablePositions = 0;

  for (let i = 0; i < length; i++) {
    const chars = alignedSeqs.map((seq) => seq[i]).filter((c) => c !== '-');
    if (chars.length >= 2) {
      comparablePositions++;
      if (chars.every((c) => c === chars[0])) {
        identicalPositions++;
      }
    }
  }

  return comparablePositions > 0 ? (identicalPositions / comparablePositions) * 100 : 0;
}

// Main MSA function using progressive alignment
export function multipleSequenceAlignment(
  sequences: { name: string; sequence: string }[]
): AlignmentResult {
  if (sequences.length === 0) {
    return {
      alignedSequences: [],
      consensusSequence: '',
      identityScore: 0,
    };
  }

  if (sequences.length === 1) {
    return {
      alignedSequences: sequences,
      consensusSequence: sequences[0].sequence,
      identityScore: 100,
    };
  }

  // Start with first two sequences
  const { aligned1, aligned2 } = needlemanWunsch(sequences[0].sequence, sequences[1].sequence);
  let profile = [aligned1, aligned2];

  // Progressively add remaining sequences
  for (let i = 2; i < sequences.length; i++) {
    profile = alignToProfile(profile, sequences[i].sequence);
  }

  // Create result with names
  const alignedSequences = sequences.map((seq, idx) => ({
    name: seq.name,
    sequence: profile[idx],
  }));

  const consensusSequence = calculateConsensus(profile);
  const identityScore = calculateIdentity(profile);

  return {
    alignedSequences,
    consensusSequence,
    identityScore: Math.round(identityScore * 100) / 100,
  };
}
