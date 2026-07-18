import { IEmbeddingProvider } from "../domain/interfaces/IEmbeddingProvider";
import { StubEmbeddingProvider } from "../providers/embeddings/StubEmbeddingProvider";

// Swap StubEmbeddingProvider for a real IEmbeddingProvider implementation
// (OpenAI, Voyage AI, etc.) here once an embeddings API key is available.
export const embeddingProvider: IEmbeddingProvider = new StubEmbeddingProvider();
