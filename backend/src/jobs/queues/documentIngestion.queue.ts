import { Queue } from "bullmq";
import { redisConnection } from "../../config/redis";

export interface DocumentIngestionJobData {
  documentId: string;
}

export const documentIngestionQueue = new Queue<DocumentIngestionJobData>(
  "document-ingestion",
  { connection: redisConnection },
);
