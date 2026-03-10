import type { S3Client } from '@aws-sdk/client-s3';
import type { Logger } from '../utils/logger';
import { StorageNotImplementedError } from './storageErrors';
import type { StorageGetResult, StorageProvider } from './storageProvider';

/**
 * S3 storage provider stub.
 *
 * This placeholder establishes the import structure for a real S3 implementation.
 * Replace the method bodies with actual S3 SDK calls when ready.
 *
 * Expected dependencies (already in the project):
 *   - @aws-sdk/client-s3 (PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand)
 *   - @aws-sdk/s3-request-presigner (getSignedUrl)
 */

interface S3StorageProviderConfig {
  s3Client: S3Client;
  bucket: string;
  region: string;
  logger: Logger;
}

const PROVIDER_NAME = 'S3StorageProvider';

export const createS3StorageProvider = (
  _config: S3StorageProviderConfig,
): StorageProvider => {
  const throwNotImplemented = (): never => {
    throw new StorageNotImplementedError(PROVIDER_NAME);
  };

  return {
    put: async (): Promise<string> => throwNotImplemented(),
    get: async (): Promise<StorageGetResult> => throwNotImplemented(),
    getPresignedPutUrl: async (): Promise<string> => throwNotImplemented(),
    getPresignedGetUrl: async (): Promise<string> => throwNotImplemented(),
    delete: async (): Promise<void> => throwNotImplemented(),
    exists: async (): Promise<boolean> => throwNotImplemented(),
  };
};
