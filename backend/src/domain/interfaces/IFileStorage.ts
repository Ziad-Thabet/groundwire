export interface SavedFile {
  storagePath: string;
}

export interface IFileStorage {
  save(buffer: Buffer, filename: string): Promise<SavedFile>;
  read(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
}
