import crypto from "crypto";
import {
  createDocument,
  findDocumentById,
  updateDocumentStatus,
} from "../repositories/document.repository";
import {
  findMaxChunkIndex,
  createDocumentChunk,
} from "../repositories/documentChunk.repository";
import { fileStorage } from "../config/fileStorage";
import { embeddingProvider } from "../config/embeddingProvider";
import { extractText } from "../providers/parsers/textExtraction";
import { chunkText } from "../utils/chunking";
import { documentIngestionQueue } from "../jobs/queues/documentIngestion.queue";
import { NotFoundError } from "../utils/errors";

export async function uploadDocument(
  workspaceId: string,
  uploadedBy: string,
  file: { buffer: Buffer; originalname: string; mimetype: string },
) {
  const fileHash = crypto
    .createHash("sha256")
    .update(file.buffer)
    .digest("hex");

  const { storagePath } = await fileStorage.save(
    file.buffer,
    file.originalname,
  );

  const document = await createDocument({
    workspaceId,
    uploadedBy,
    filename: file.originalname,
    fileHash,
    storagePath,
    mimeType: file.mimetype,
  });

  await documentIngestionQueue.add(
    "process",
    { documentId: document.id },
    {
      attempts: 3, // 1 initial + 2 retries, per spec §5.2
      backoff: { type: "exponential", delay: 5000 },
    },
  );

  return document;
}

export async function processDocument(documentId: string): Promise<void> {
  const document = await findDocumentById(documentId);
  if (!document) {
    throw new NotFoundError("Document not found");
  }

  try {
    const buffer = await fileStorage.read(document.storagePath);
    const { text, pageCount } = await extractText(buffer, document.mimeType);

    if (!text || text.trim().length === 0) {
      await updateDocumentStatus(documentId, {
        status: "failed",
        failReason: "No extractable text found — OCR not supported in this version.",
      });
      return;
    }

    const chunks = chunkText(text);
    const startIndex = (await findMaxChunkIndex(documentId)) + 1;

    for (let i = 0; i < chunks.length; i++) {
      const chunkIndex = startIndex + i;
      const embedding = await embeddingProvider.embed(chunks[i]);
      await createDocumentChunk({
        documentId,
        content: chunks[i],
        embedding,
        embeddingModel: embeddingProvider.modelName,
        chunkIndex,
      });
    }

    await updateDocumentStatus(documentId, {
      status: "ready",
      pageCount,
    });
  } catch (err) {
    await updateDocumentStatus(documentId, {
      status: "failed",
      failReason: err instanceof Error ? err.message : "Unknown processing error",
    });
    throw err;
  }
}
