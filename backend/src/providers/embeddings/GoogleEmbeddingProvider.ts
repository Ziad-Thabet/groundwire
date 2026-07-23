import { env } from "../../env";
import { IEmbeddingProvider } from "../../domain/interfaces/IEmbeddingProvider";

const MODEL_NAME = "gemini-embedding-001";
const OUTPUT_DIMENSIONS = 1536; // matches the existing vector(1536) schema column
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:embedContent`;

/**
 * Real semantic embeddings via Google's Gemini Embedding API (free tier).
 *
 * IMPORTANT: gemini-embedding-001 only auto-normalizes output at its full
 * native 3072 dimensions. When output_dimensionality truncates the vector
 * (as we do here, to 1536 to match the existing schema), the API returns
 * an UN-normalized vector -- we must L2-normalize it ourselves, or cosine
 * similarity search in pgvector will silently rank results incorrectly.
 * (This differs from the newer gemini-embedding-2 model, which does
 * auto-normalize truncated output -- do not assume this class's logic
 * would still be correct if the model were ever swapped.)
 */
export class GoogleEmbeddingProvider implements IEmbeddingProvider {
  readonly modelName = MODEL_NAME;

  constructor() {
    if (!env.GOOGLE_API_KEY) {
      throw new Error(
        "GoogleEmbeddingProvider requires GOOGLE_API_KEY to be set.",
      );
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${API_URL}?key=${env.GOOGLE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${MODEL_NAME}`,
        content: { parts: [{ text }] },
        task_type: "RETRIEVAL_DOCUMENT",
        output_dimensionality: OUTPUT_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Google embedding API request failed (${response.status}): ${errorBody}`,
      );
    }

    const data = (await response.json()) as {
      embedding?: { values?: number[] };
    };

    const values = data.embedding?.values;
    if (!values || values.length !== OUTPUT_DIMENSIONS) {
      throw new Error(
        `Google embedding API returned an unexpected response shape: ${JSON.stringify(data)}`,
      );
    }

    return normalize(values);
  }
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0),
  );
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
}
