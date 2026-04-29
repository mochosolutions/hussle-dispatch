import { createReadStream, createWriteStream } from 'fs';
import { access, mkdir, readFile, readdir, rmdir, stat, unlink, writeFile } from 'fs/promises';
import { dirname, join, relative, resolve } from 'path';
import type { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import type { Logger } from '../utils/logger';
import { StorageDeleteError, StorageFileNotFoundError, StorageWriteError } from './storageErrors';
import type { DeleteByPrefixResult, StorageGetResult, StorageObjectMetadata, StorageProvider } from './storageProvider';

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

  const getFile = async (key: string): Promise<Buffer> => {
    const filePath = getFilePath(key);

    try {
      await access(filePath);
    } catch {
      throw new StorageFileNotFoundError(key);
    }

    try {
      return await readFile(filePath);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'Unknown read error';
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

  const cleanupEmptyParents = async (filePath: string): Promise<void> => {
    let dir = dirname(filePath);
    while (dir !== resolvedBase && dir.startsWith(resolvedBase)) {
      try {
        await rmdir(dir);
        dir = dirname(dir);
      } catch {
        // Directory not empty or already removed — stop climbing
        break;
      }
    }
  };

  const deleteMany = async (keys: string[]): Promise<void> => {
    const results = await Promise.all(
      keys.map(async (key) => {
        try {
          await deleteFile(key);
          return { key, success: true };
        } catch (error: unknown) {
          logger.warn('Local storage: deleteMany failed for key', {
            key,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
          return { key, success: false };
        }
      }),
    );

    const deleted = results.filter((r) => r.success);
    logger.info('Local storage: deleteMany completed', {
      requested: keys.length,
      deleted: deleted.length,
    });

    // Best-effort cleanup of empty parent directories
    for (const key of keys) {
      await cleanupEmptyParents(getFilePath(key));
    }
  };

  const list = async (prefix: string): Promise<string[]> => {
    const dirPath = join(resolvedBase, prefix);

    try {
      await access(dirPath);
    } catch {
      return [];
    }

    try {
      const entries = await readdir(dirPath, { recursive: true, withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile() && !entry.name.endsWith(METADATA_SUFFIX))
        .map((entry) => {
          const parentPath = entry.parentPath ?? entry.path;
          const fullPath = join(parentPath, entry.name);
          return relative(resolvedBase, fullPath).split('\\').join('/');
        });
    } catch (error: unknown) {
      logger.warn('Local storage: list failed', {
        prefix,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  };

  const deleteByPrefix = async (prefix: string): Promise<DeleteByPrefixResult> => {
    const keys = await list(prefix);

    if (keys.length === 0) {
      return { deletedCount: 0 };
    }

    await deleteMany(keys);
    logger.info('Local storage: deleteByPrefix completed', { prefix, deletedCount: keys.length });
    return { deletedCount: keys.length };
  };

  const getMetadata = async (key: string): Promise<StorageObjectMetadata> => {
    const filePath = getFilePath(key);
    try {
      const stats = await stat(filePath);
      return { size: stats.size };
    } catch {
      throw new StorageFileNotFoundError(key);
    }
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
    getFile,
    getPresignedPutUrl,
    getPresignedGetUrl,
    delete: deleteFile,
    deleteMany,
    deleteByPrefix,
    list,
    exists,
    getMetadata,
  };
};
