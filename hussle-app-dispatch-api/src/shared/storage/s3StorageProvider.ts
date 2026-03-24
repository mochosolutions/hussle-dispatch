import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import type { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import type { Logger } from '../utils/logger';
import {
  StorageDeleteError,
  StorageFileNotFoundError,
  StorageReadError,
  StorageWriteError,
} from './storageErrors';
import type { DeleteByPrefixResult, StorageGetResult, StorageProvider } from './storageProvider';

interface S3StorageProviderConfig {
  s3Client: S3Client;
  bucket: string;
  region: string;
  logger: Logger;
}

const PROVIDER_NAME = 'S3StorageProvider';
const DEFAULT_PRESIGN_EXPIRATION_SECONDS = 900;
const S3_DELETE_BATCH_LIMIT = 1000;

const normalizeKey = (key: string): string => key.replace(/^\/+/, '');

const isErrorWithName = (error: unknown): error is { name: string } =>
  typeof error === 'object' && error !== null && 'name' in error;

const isS3NotFound = (error: unknown): boolean =>
  isErrorWithName(error) && (error.name === 'NoSuchKey' || error.name === 'NotFound');

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export const createS3StorageProvider = (
  config: S3StorageProviderConfig,
): StorageProvider => {
  const { s3Client, bucket, logger } = config;

  const put = async (
    key: string,
    body: Buffer | Readable,
    contentType: string,
  ): Promise<string> => {
    const normalizedKey = normalizeKey(key);
    logger.info(`${PROVIDER_NAME}: putting object`, { key: normalizedKey, contentType });

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: normalizedKey,
          Body: body,
          ContentType: contentType,
        }),
      );

      logger.info(`${PROVIDER_NAME}: object written`, { key: normalizedKey });
      return normalizedKey;
    } catch (error: unknown) {
      const reason = getErrorMessage(error);
      logger.error(`${PROVIDER_NAME}: put failed`, { key: normalizedKey, reason });
      throw new StorageWriteError(normalizedKey, reason);
    }
  };

  const getFile = async (key: string): Promise<Buffer> => {
    const normalizedKey = normalizeKey(key);
    logger.info(`${PROVIDER_NAME}: getting file as buffer`, { key: normalizedKey });

    try {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: normalizedKey,
        }),
      );

      if (!response.Body) {
        throw new StorageReadError(normalizedKey, 'Response body is empty');
      }

      if (!(response.Body instanceof Readable)) {
        throw new StorageReadError(normalizedKey, 'Response body is not a readable stream');
      }

      const chunks: Buffer[] = [];
      for await (const chunk of response.Body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      logger.info(`${PROVIDER_NAME}: file retrieved as buffer`, { key: normalizedKey });
      return Buffer.concat(chunks);
    } catch (error: unknown) {
      if (error instanceof StorageReadError) {
        throw error;
      }
      if (isS3NotFound(error)) {
        throw new StorageFileNotFoundError(normalizedKey);
      }
      const reason = getErrorMessage(error);
      logger.error(`${PROVIDER_NAME}: getFile failed`, { key: normalizedKey, reason });
      throw new StorageReadError(normalizedKey, reason);
    }
  };

  const get = async (key: string): Promise<StorageGetResult> => {
    const normalizedKey = normalizeKey(key);
    logger.info(`${PROVIDER_NAME}: getting object`, { key: normalizedKey });

    try {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: normalizedKey,
        }),
      );

      if (!response.Body) {
        throw new StorageReadError(normalizedKey, 'Response body is empty');
      }

      // SDK v3 Body in Node.js is SdkStream<IncomingMessage | Readable>
      // which is itself a Readable; narrow with instanceof for type safety
      if (!(response.Body instanceof Readable)) {
        throw new StorageReadError(normalizedKey, 'Response body is not a readable stream');
      }

      const body: Readable = response.Body;
      const contentType = response.ContentType ?? 'application/octet-stream';

      logger.info(`${PROVIDER_NAME}: object retrieved`, { key: normalizedKey, contentType });
      return { body, contentType };
    } catch (error: unknown) {
      if (error instanceof StorageReadError) {
        throw error;
      }
      if (isS3NotFound(error)) {
        throw new StorageFileNotFoundError(normalizedKey);
      }
      const reason = getErrorMessage(error);
      logger.error(`${PROVIDER_NAME}: get failed`, { key: normalizedKey, reason });
      throw new StorageReadError(normalizedKey, reason);
    }
  };

  const getPresignedPutUrl = async (
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<string> => {
    const normalizedKey = normalizeKey(key);
    const ttl = expiresIn ?? DEFAULT_PRESIGN_EXPIRATION_SECONDS;
    logger.info(`${PROVIDER_NAME}: generating presigned PUT URL`, {
      key: normalizedKey,
      expiresIn: ttl,
    });

    try {
      const url = await getSignedUrl(
        s3Client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: normalizedKey,
          ContentType: contentType,
        }),
        { expiresIn: ttl },
      );

      logger.info(`${PROVIDER_NAME}: presigned PUT URL generated`, { key: normalizedKey });
      return url;
    } catch (error: unknown) {
      const reason = getErrorMessage(error);
      logger.error(`${PROVIDER_NAME}: presigned PUT URL failed`, { key: normalizedKey, reason });
      throw new StorageWriteError(normalizedKey, reason);
    }
  };

  const getPresignedGetUrl = async (
    key: string,
    expiresIn?: number,
  ): Promise<string> => {
    const normalizedKey = normalizeKey(key);
    const ttl = expiresIn ?? DEFAULT_PRESIGN_EXPIRATION_SECONDS;
    logger.info(`${PROVIDER_NAME}: generating presigned GET URL`, {
      key: normalizedKey,
      expiresIn: ttl,
    });

    try {
      const url = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: bucket,
          Key: normalizedKey,
        }),
        { expiresIn: ttl },
      );

      logger.info(`${PROVIDER_NAME}: presigned GET URL generated`, { key: normalizedKey });
      return url;
    } catch (error: unknown) {
      const reason = getErrorMessage(error);
      logger.error(`${PROVIDER_NAME}: presigned GET URL failed`, { key: normalizedKey, reason });
      throw new StorageReadError(normalizedKey, reason);
    }
  };

  const deleteFile = async (key: string): Promise<void> => {
    const normalizedKey = normalizeKey(key);
    logger.info(`${PROVIDER_NAME}: deleting object`, { key: normalizedKey });

    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: normalizedKey,
        }),
      );

      logger.info(`${PROVIDER_NAME}: object deleted`, { key: normalizedKey });
    } catch (error: unknown) {
      if (isS3NotFound(error)) {
        logger.warn(`${PROVIDER_NAME}: object already absent on delete`, { key: normalizedKey });
        return;
      }
      const reason = getErrorMessage(error);
      logger.error(`${PROVIDER_NAME}: delete failed`, { key: normalizedKey, reason });
      throw new StorageDeleteError(normalizedKey, reason);
    }
  };

  const exists = async (key: string): Promise<boolean> => {
    const normalizedKey = normalizeKey(key);
    logger.info(`${PROVIDER_NAME}: checking existence`, { key: normalizedKey });

    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: normalizedKey,
        }),
      );

      return true;
    } catch (error: unknown) {
      if (isS3NotFound(error)) {
        return false;
      }
      logger.warn(`${PROVIDER_NAME}: existence check failed, returning false`, {
        key: normalizedKey,
        reason: getErrorMessage(error),
      });
      return false;
    }
  };

  const list = async (prefix: string): Promise<string[]> => {
    const normalizedPrefix = normalizeKey(prefix);
    logger.info(`${PROVIDER_NAME}: listing objects`, { prefix: normalizedPrefix });

    const keys: string[] = [];
    let continuationToken: string | undefined;

    try {
      do {
        const response = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: normalizedPrefix,
            ContinuationToken: continuationToken,
          }),
        );

        const contents = response.Contents ?? [];
        contents.forEach((item) => {
          if (item.Key) {
            keys.push(item.Key);
          }
        });

        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
      } while (continuationToken);

      logger.info(`${PROVIDER_NAME}: listed objects`, {
        prefix: normalizedPrefix,
        count: keys.length,
      });
      return keys;
    } catch (error: unknown) {
      const reason = getErrorMessage(error);
      logger.error(`${PROVIDER_NAME}: list failed`, { prefix: normalizedPrefix, reason });
      throw new StorageReadError(normalizedPrefix, reason);
    }
  };

  const deleteMany = async (keys: string[]): Promise<void> => {
    if (keys.length === 0) {
      return;
    }

    const normalizedKeys = keys.map(normalizeKey);
    logger.info(`${PROVIDER_NAME}: deleting multiple objects`, { count: normalizedKeys.length });

    try {
      // Process in batches of 1000 (S3 limit)
      for (let i = 0; i < normalizedKeys.length; i += S3_DELETE_BATCH_LIMIT) {
        const batch = normalizedKeys.slice(i, i + S3_DELETE_BATCH_LIMIT);

        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: batch.map((key) => ({ Key: key })),
              Quiet: true,
            },
          }),
        );
      }

      logger.info(`${PROVIDER_NAME}: multiple objects deleted`, { count: normalizedKeys.length });
    } catch (error: unknown) {
      const reason = getErrorMessage(error);
      logger.error(`${PROVIDER_NAME}: deleteMany failed`, { reason });
      throw new StorageDeleteError('batch', reason);
    }
  };

  const deleteByPrefix = async (prefix: string): Promise<DeleteByPrefixResult> => {
    const normalizedPrefix = normalizeKey(prefix);
    logger.info(`${PROVIDER_NAME}: deleting by prefix`, { prefix: normalizedPrefix });

    try {
      const keys = await list(normalizedPrefix);

      if (keys.length === 0) {
        logger.info(`${PROVIDER_NAME}: no objects found for prefix`, {
          prefix: normalizedPrefix,
        });
        return { deletedCount: 0 };
      }

      await deleteMany(keys);

      logger.info(`${PROVIDER_NAME}: deleted by prefix`, {
        prefix: normalizedPrefix,
        deletedCount: keys.length,
      });
      return { deletedCount: keys.length };
    } catch (error: unknown) {
      if (error instanceof StorageReadError || error instanceof StorageDeleteError) {
        throw error;
      }
      const reason = getErrorMessage(error);
      logger.error(`${PROVIDER_NAME}: deleteByPrefix failed`, {
        prefix: normalizedPrefix,
        reason,
      });
      throw new StorageDeleteError(normalizedPrefix, reason);
    }
  };

  return {
    put,
    get,
    getFile,
    getPresignedPutUrl,
    getPresignedGetUrl,
    delete: deleteFile,
    exists,
    deleteMany,
    deleteByPrefix,
    list,
  };
};
