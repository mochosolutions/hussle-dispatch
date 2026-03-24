import type { S3Client } from '@aws-sdk/client-s3';
import type { Logger } from '../utils/logger';
import { createLocalStorageProvider } from './localStorageProvider';
import { createS3StorageProvider } from './s3StorageProvider';
import type { StorageProvider } from './storageProvider';

export type { StorageProvider, StorageGetResult, DeleteByPrefixResult } from './storageProvider';
export { StorageFileNotFoundError, StorageWriteError, StorageReadError, StorageDeleteError, StorageNotImplementedError } from './storageErrors';
export { createLocalStorageProvider } from './localStorageProvider';
export { createS3StorageProvider } from './s3StorageProvider';

interface LocalStorageConfig {
  backend: 'local';
  basePath: string;
  baseUrl: string;
}

interface S3StorageConfig {
  backend: 's3';
  s3Client: S3Client;
  bucket: string;
  region: string;
}

type StorageConfig = LocalStorageConfig | S3StorageConfig;

/**
 * Factory that creates a StorageProvider based on configuration.
 *
 * - backend: 'local' uses the filesystem (dev/test).
 * - backend: 's3' creates the S3 stub (replace with real impl when ready).
 */
export const createStorageProvider = (
  config: StorageConfig,
  logger: Logger,
): StorageProvider => {
  if (config.backend === 'local') {
    return createLocalStorageProvider({
      basePath: config.basePath,
      baseUrl: config.baseUrl,
      logger,
    });
  }

  if (config.backend === 's3') {
    return createS3StorageProvider({
      s3Client: config.s3Client,
      bucket: config.bucket,
      region: config.region,
      logger,
    });
  }

  // Exhaustiveness check — TypeScript ensures all backends are handled
  const exhaustive: never = config;
  throw new Error(`Unknown storage backend: ${String(exhaustive)}`);
};
