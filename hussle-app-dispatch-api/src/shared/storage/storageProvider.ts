import type { Readable } from 'stream';

export interface StorageGetResult {
  body: Readable;
  contentType: string;
}

export interface StorageProvider {
  put(key: string, body: Buffer | Readable, contentType: string): Promise<string>;
  get(key: string): Promise<StorageGetResult>;
  getPresignedPutUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
  getPresignedGetUrl(key: string, expiresIn?: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
