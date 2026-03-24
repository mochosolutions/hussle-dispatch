import type { Readable } from 'stream';

export interface StorageGetResult {
  body: Readable;
  contentType: string;
}

export interface DeleteByPrefixResult {
  deletedCount: number;
}

export interface StorageProvider {
  put(key: string, body: Buffer | Readable, contentType: string): Promise<string>;
  get(key: string): Promise<StorageGetResult>;
  getFile(key: string): Promise<Buffer>;
  getPresignedPutUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
  getPresignedGetUrl(key: string, expiresIn?: number): Promise<string>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  deleteByPrefix(prefix: string): Promise<DeleteByPrefixResult>;
  list(prefix: string): Promise<string[]>;
  exists(key: string): Promise<boolean>;
}
