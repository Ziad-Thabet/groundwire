import { env } from "../env";
import { IEmbeddingProvider } from "../domain/interfaces/IEmbeddingProvider";
import { StubEmbeddingProvider } from "../providers/embeddings/StubEmbeddingProvider";
import { GoogleEmbeddingProvider } from "../providers/embeddings/GoogleEmbeddingProvider";

// Uses real semantic embeddings (Google Gemini) when GOOGLE_API_KEY is
// configured, falling back to the deterministic stub otherwise -- so the
// app still boots and the ingestion pipeline is still testable without
// any embeddings API key present.
export const embeddingProvider: IEmbeddingProvider = env.GOOGLE_API_KEY
  ? new GoogleEmbeddingProvider()
  : new StubEmbeddingProvider();
