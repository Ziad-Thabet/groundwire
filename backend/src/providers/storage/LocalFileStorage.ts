import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { IFileStorage, SavedFile } from "../../domain/interfaces/IFileStorage";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

/**
 * Dev-mode file storage. Saves files to local disk under ./uploads.
 * Does NOT survive a redeploy on ephemeral hosting (e.g. Render) and does
 * not work across multiple backend instances. Swap for a real
 * IFileStorage implementation (S3, Cloudflare R2, etc.) before production.
 */
export class LocalFileStorage implements IFileStorage {
  async save(buffer: Buffer, filename: string): Promise<SavedFile> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const ext = path.extname(filename);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const storagePath = path.join(UPLOAD_DIR, uniqueName);

    await fs.writeFile(storagePath, buffer);

    return { storagePath };
  }

  async read(storagePath: string): Promise<Buffer> {
    return fs.readFile(storagePath);
  }

  async delete(storagePath: string): Promise<void> {
    await fs.unlink(storagePath).catch(() => {
      // Already deleted or never existed — not a failure case for cleanup.
    });
  }
}
