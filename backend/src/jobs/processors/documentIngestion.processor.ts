import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis";
import { processDocument } from "../../services/document.service";
import { DocumentIngestionJobData } from "../queues/documentIngestion.queue";

const CONCURRENCY = 3; // per-worker concurrency; per-workspace limiting is a fast-follow

export const documentIngestionWorker = new Worker<DocumentIngestionJobData>(
  "document-ingestion",
  async (job) => {
    await processDocument(job.data.documentId);
  },
  {
    connection: redisConnection,
    concurrency: CONCURRENCY,
  },
);

documentIngestionWorker.on("completed", (job) => {
  console.log(`[DocumentIngestion] Job ${job.id} completed (document ${job.data.documentId})`);
});

documentIngestionWorker.on("failed", (job, err) => {
  console.error("[DocumentIngestion] Job failed", {
    jobId: job?.id,
    documentId: job?.data.documentId,
    error: err.message,
  });
});
