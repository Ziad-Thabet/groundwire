import { DelayedError, Worker } from "bullmq";
import { redisConnection } from "../../config/redis";
import { processDocument } from "../../services/document.service";
import { findDocumentById } from "../../repositories/document.repository";
import {
  acquireWorkspaceSlot,
  releaseWorkspaceSlot,
} from "../../utils/workspaceConcurrency";
import { DocumentIngestionJobData } from "../queues/documentIngestion.queue";

const CONCURRENCY = 3; // per-worker global concurrency ceiling
const DEFER_DELAY_MS = 5000; // how long to wait before re-checking a full workspace slot

export const documentIngestionWorker = new Worker<DocumentIngestionJobData>(
  "document-ingestion",
  async (job, token) => {
    const document = await findDocumentById(job.data.documentId);
    if (!document) {
      // Let processDocument's own lookup produce the real NotFoundError
      // and consistent handling -- this is just for the workspaceId.
      await processDocument(job.data.documentId);
      return;
    }

    const acquired = await acquireWorkspaceSlot(document.workspaceId);
    if (!acquired) {
      // Workspace is already at its concurrency limit -- reschedule
      // this job to try again shortly. Not a failure: no retry attempt
      // is consumed, and no 'failed' event fires.
      await job.moveToDelayed(Date.now() + DEFER_DELAY_MS, token);
      throw new DelayedError();
    }

    try {
      await processDocument(job.data.documentId);
    } finally {
      await releaseWorkspaceSlot(document.workspaceId);
    }
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
