import { IFileStorage } from "../domain/interfaces/IFileStorage";
import { LocalFileStorage } from "../providers/storage/LocalFileStorage";

// Swap LocalFileStorage for a real IFileStorage implementation
// (S3, Cloudflare R2, etc.) here before production use.
export const fileStorage: IFileStorage = new LocalFileStorage();
