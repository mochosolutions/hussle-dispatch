import { createReadStream, createWriteStream } from 'fs';
import { access, mkdir, unlink, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import type { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import type { Logger } from '../utils/logger';
import { StorageDeleteError, StorageFileNotFoundError, StorageWriteError } from './storageErrors';
import type { StorageGetResult, StorageProvider } from './storageProvider';

interface LocalStorageProviderConfig {
  basePath: string;
  baseUrl: string;
  logger: Logger;
}

const METADATA_SUFFIX = '.__meta';

const isErrorWithCode = (error: unknown): error is { code: string } =>
  typeof error === 'object' && error !== null && 'code' in error;

const writeMetadata = async (filePath: string, contentType: string): Promise<void> => {
  await writeFile(`${filePath}${METADATA_SUFFIX}`, contentType, 'utf-8');
};

const readMetadata = async (filePath: string): Promise<string> => {
  const { readFile } = await import('fs/promises');
  const content = await readFile(`${filePath}${METADATA_SUFFIX}`, 'utf-8');
  return content || 'application/octet-stream';
};

export const createLocalStorageProvider = (
  config: LocalStorageProviderConfig,
): StorageProvider => {
  const { basePath, baseUrl, logger } = config;
  const resolvedBase = resolve(basePath);

  const getFilePath = (key: string): string => join(resolvedBase, key);

  const ensureDirectory = async (filePath: string): Promise<void> => {
    await mkdir(dirname(filePath), { recursive: true });
  };

  const put = async (
    key: string,
    body: Buffer | Readable,
    contentType: string,
  ): Promise<string> => {
    const filePath = getFilePath(key);
    await ensureDirectory(filePath);

    try {
      if (Buffer.isBuffer(body)) {
        await writeFile(filePath, body);
      } else {
        const writeStream = createWriteStream(filePath);
        await pipeline(body, writeStream);
      }

      await writeMetadata(filePath, contentType);
      logger.info('Local storage: file written', { key });
      return key;
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'Unknown write error';
      throw new StorageWriteError(key, reason);
    }
  };

  const get = async (key: string): Promise<StorageGetResult> => {
    const filePath = getFilePath(key);

    try {
      await access(filePath);
    } catch {
      throw new StorageFileNotFoundError(key);
    }

    let contentType = 'application/octet-stream';
    try {
      contentType = await readMetadata(filePath);
    } catch {
      logger.warn('Local storage: metadata not found, defaulting content type', { key });
    }

    const body = createReadStream(filePath);
    return { body, contentType };
  };

  const getPresignedPutUrl = async (
    key: string,
    _contentType: string,
    _expiresIn?: number,
  ): Promise<string> => {
    // In local dev, presigned URLs point to the local HTTP endpoint
    return `${baseUrl}/${key}`;
  };

  const getPresignedGetUrl = async (
    key: string,
    _expiresIn?: number,
  ): Promise<string> => {
    return `${baseUrl}/${key}`;
  };

  const deleteFile = async (key: string): Promise<void> => {
    const filePath = getFilePath(key);

    try {
      await unlink(filePath);
    } catch (error: unknown) {
      if (isErrorWithCode(error) && error.code === 'ENOENT') {
        logger.warn('Local storage: file already absent on delete', { key });
        return;
      }
      const reason = error instanceof Error ? error.message : 'Unknown delete error';
      throw new StorageDeleteError(key, reason);
    }

    // Best-effort metadata cleanup
    try {
      await unlink(`${filePath}${METADATA_SUFFIX}`);
    } catch {
      // Metadata file may not exist — safe to ignore
    }

    logger.info('Local storage: file deleted', { key });
  };

  const exists = async (key: string): Promise<boolean> => {
    const filePath = getFilePath(key);
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  };

  return {
    put,
    get,
    getPresignedPutUrl,
    getPresignedGetUrl,
    delete: deleteFile,
    exists,
  };
};
