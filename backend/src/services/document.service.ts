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
import {
  extractText,
  PermanentExtractionError,
} from "../providers/parsers/textExtraction";
import { chunkText } from "../utils/chunking";
import { documentIngestionQueue } from "../jobs/queues/documentIngestion.queue";
import { ConflictError, NotFoundError } from "../utils/errors";
import { findDocumentByHash } from "../repositories/document.repository";
import { validateFileContent } from "../utils/fileContentValidation";

export async function uploadDocument(
  workspaceId: string,
  uploadedBy: string,
  file: { buffer: Buffer; originalname: string; mimetype: string },
  options: { confirmDuplicate?: boolean } = {},
) {
  const fileHash = crypto
    .createHash("sha256")
    .update(file.buffer)
    .digest("hex");

  if (!options.confirmDuplicate) {
    const existing = await findDocumentByHash(workspaceId, fileHash);
    if (existing) {
      throw new ConflictError(
        "A document with identical content already exists in this workspace. " +
          "Resubmit with confirmDuplicate to upload anyway.",
      );
    }
  }

  await validateFileContent(file.buffer, file.mimetype);

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
        failReason:
          "No extractable text found — OCR not supported in this version.",
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
      failReason: null,
    });
  } catch (err) {
    const failReason =
      err instanceof Error ? err.message : "Unknown processing error";

    await updateDocumentStatus(documentId, {
      status: "failed",
      failReason,
    });

    if (err instanceof PermanentExtractionError) {
      // Doomed to fail identically every time -- don't let BullMQ burn
      // its 3 retry attempts on it.
      return;
    }

    throw err;
  }
}
