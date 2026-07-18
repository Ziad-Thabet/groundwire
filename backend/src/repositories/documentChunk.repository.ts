import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

type Client = Prisma.TransactionClient | typeof prisma;

export async function findMaxChunkIndex(
  documentId: string,
  client: Client = prisma,
): Promise<number> {
  const last = await client.documentChunk.findFirst({
    where: { documentId },
    orderBy: { chunkIndex: "desc" },
    select: { chunkIndex: true },
  });
  return last?.chunkIndex ?? -1;
}

export async function createDocumentChunk(
  data: {
    documentId: string;
    content: string;
    embedding: number[];
    embeddingModel: string;
    chunkIndex: number;
  },
  client: Client = prisma,
): Promise<void> {
  const vectorLiteral = `[${data.embedding.join(",")}]`;
  await client.$executeRaw`
    INSERT INTO document_chunks (id, document_id, content, embedding, embedding_model, chunk_index, created_at)
    VALUES (gen_random_uuid(), ${data.documentId}, ${data.content}, ${vectorLiteral}::vector, ${data.embeddingModel}, ${data.chunkIndex}, now())
  `;
}
