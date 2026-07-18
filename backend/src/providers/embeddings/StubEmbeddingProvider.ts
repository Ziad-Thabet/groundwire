import crypto from "crypto";
import { IEmbeddingProvider } from "../../domain/interfaces/IEmbeddingProvider";

const DIMENSIONS = 1536;

/**
 * Dev-mode embedding provider. Generates a deterministic pseudo-random
 * vector derived from a hash of the input text — NOT a real semantic
 * embedding, so similarity search results will be meaningless. This lets
 * the ingestion pipeline (chunking, storage, retry logic) be built and
 * tested without an embeddings API key. Swap for a real IEmbeddingProvider
 * implementation (OpenAI, Voyage AI, etc.) before enabling RAG search.
 */
export class StubEmbeddingProvider implements IEmbeddingProvider {
  readonly modelName = "stub-deterministic-v1";

  async embed(text: string): Promise<number[]> {
    const vector: number[] = [];
    let seed = crypto.createHash("sha256").update(text).digest();

    while (vector.length < DIMENSIONS) {
      seed = crypto.createHash("sha256").update(seed).digest();
      for (let i = 0; i < seed.length && vector.length < DIMENSIONS; i++) {
        // Map each byte (0-255) to a small float in [-1, 1].
        vector.push(seed[i] / 127.5 - 1);
      }
    }

    return vector;
  }
}
