import type { Readable } from 'stream';

export interface StorageGetResult {
  body: Readable;
  contentType: string;
}

export interface DeleteByPrefixResult {
  deletedCount: number;
}

export interface StorageObjectMetadata {
  size: number;
}

export type ContentDisposition = 'inline' | 'attachment';

export interface StorageProvider {
  /**
   * Writes an object to storage at the given key and returns the storage key itself
   * (NOT a URL). Storage URLs are intentionally not exposed by the provider — they
   * are resolved on demand inside scoped per-entity download controllers so that
   * (a) access can be authorized against the owning entity's organizationId, and
   * (b) S3 presigned URLs are minted just-in-time with short TTLs rather than
   * persisted on a row where they could leak.
   */
  put(key: string, body: Buffer | Readable, contentType: string): Promise<string>;
  get(key: string): Promise<StorageGetResult>;
  getFile(key: string): Promise<Buffer>;
  getPresignedPutUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
  getPresignedGetUrl(
    key: string,
    expiresIn?: number,
    displayName?: string,
    disposition?: ContentDisposition,
  ): Promise<string>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  deleteByPrefix(prefix: string): Promise<DeleteByPrefixResult>;
  list(prefix: string): Promise<string[]>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<StorageObjectMetadata>;
}
