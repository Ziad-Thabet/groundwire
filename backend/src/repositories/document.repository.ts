import { Document, DocumentStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

type Client = Prisma.TransactionClient | typeof prisma;

export async function createDocument(
  data: {
    workspaceId: string;
    uploadedBy: string;
    filename: string;
    fileHash: string;
    storagePath: string;
    mimeType: string;
  },
  client: Client = prisma,
): Promise<Document> {
  return client.document.create({ data });
}

export async function findDocumentById(
  id: string,
  client: Client = prisma,
): Promise<Document | null> {
  return client.document.findUnique({ where: { id } });
}

export async function findDocumentByHash(
  workspaceId: string,
  fileHash: string,
  client: Client = prisma,
): Promise<Document | null> {
  return client.document.findFirst({
    where: { workspaceId, fileHash, deletedAt: null },
  });
}

export async function updateDocumentStatus(
  id: string,
  data: { status: DocumentStatus; failReason?: string; pageCount?: number },
  client: Client = prisma,
): Promise<Document> {
  return client.document.update({
    where: { id },
    data,
  });
}
