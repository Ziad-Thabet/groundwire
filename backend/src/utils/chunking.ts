const CHUNK_SIZE_WORDS = 800;
const CHUNK_OVERLAP_WORDS = 150;

/**
 * Splits text into overlapping chunks, breaking on sentence boundaries
 * where possible rather than cutting mid-sentence. Chunk/overlap sizes
 * are approximated in words (not true LLM tokens), which is a reasonable
 * stand-in without pulling in a tokenizer dependency.
 */
export function chunkText(text: string): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 0);

  if (sentences.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let currentWords: string[] = [];

  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/);
    currentWords.push(...sentenceWords);

    if (currentWords.length >= CHUNK_SIZE_WORDS) {
      chunks.push(currentWords.join(" "));
      const overlapStart = Math.max(
        0,
        currentWords.length - CHUNK_OVERLAP_WORDS,
      );
      currentWords = currentWords.slice(overlapStart);
    }
  }

  if (currentWords.length > 0) {
    chunks.push(currentWords.join(" "));
  }

  return chunks;
}
