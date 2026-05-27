import { Readable } from 'stream';
import type { Logger } from '../../utils/logger';
import { createS3StorageProvider } from '../s3StorageProvider';
import {
  StorageDeleteError,
  StorageFileNotFoundError,
  StorageReadError,
  StorageWriteError,
} from '../storageErrors';

jest.mock('@aws-sdk/client-s3', () => ({
  DeleteObjectCommand: jest.fn().mockImplementation((input: unknown) => ({ input, _tag: 'DeleteObjectCommand' })),
  DeleteObjectsCommand: jest.fn().mockImplementation((input: unknown) => ({ input, _tag: 'DeleteObjectsCommand' })),
  GetObjectCommand: jest.fn().mockImplementation((input: unknown) => ({ input, _tag: 'GetObjectCommand' })),
  HeadObjectCommand: jest.fn().mockImplementation((input: unknown) => ({ input, _tag: 'HeadObjectCommand' })),
  ListObjectsV2Command: jest.fn().mockImplementation((input: unknown) => ({ input, _tag: 'ListObjectsV2Command' })),
  PutObjectCommand: jest.fn().mockImplementation((input: unknown) => ({ input, _tag: 'PutObjectCommand' })),
  S3Client: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

const createMockS3Client = () => ({
  send: jest.fn(),
});

const createMockLogger = (): Logger => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const BUCKET = 'test-bucket';
const REGION = 'us-east-1';

describe('createS3StorageProvider', () => {
  const s3Client = createMockS3Client();
  const logger = createMockLogger();

  const provider = createS3StorageProvider({
    s3Client: s3Client as unknown as Parameters<typeof createS3StorageProvider>[0]['s3Client'],
    bucket: BUCKET,
    region: REGION,
    logger,
  });

  beforeEach(() => jest.clearAllMocks());

  describe('put', () => {
    it('returns key on successful upload', async () => {
      s3Client.send.mockResolvedValue({});

      const result = await provider.put('documents/file.pdf', Buffer.from('data'), 'application/pdf');

      expect(result).toBe('documents/file.pdf');
      expect(s3Client.send).toHaveBeenCalledTimes(1);
    });

    it('normalizes key by stripping leading slash', async () => {
      s3Client.send.mockResolvedValue({});

      const result = await provider.put('/documents/file.pdf', Buffer.from('data'), 'application/pdf');

      expect(result).toBe('documents/file.pdf');
    });

    it('throws StorageWriteError when S3 fails', async () => {
      s3Client.send.mockRejectedValue(new Error('S3 failure'));

      await expect(
        provider.put('documents/file.pdf', Buffer.from('data'), 'application/pdf'),
      ).rejects.toThrow(StorageWriteError);
    });

    it('passes Buffer body correctly', async () => {
      s3Client.send.mockResolvedValue({});
      const body = Buffer.from('hello');

      await provider.put('key.txt', body, 'text/plain');

      const command = s3Client.send.mock.calls[0][0] as { input: { Body: Buffer } };
      expect(command.input.Body).toBe(body);
    });

    it('passes Readable body correctly', async () => {
      s3Client.send.mockResolvedValue({});
      const body = Readable.from(['stream data']);

      await provider.put('key.txt', body, 'text/plain');

      const command = s3Client.send.mock.calls[0][0] as { input: { Body: Readable } };
      expect(command.input.Body).toBe(body);
    });
  });

  describe('get', () => {
    it('returns body and contentType on success', async () => {
      const readable = new Readable({ read() { this.push(null); } });
      s3Client.send.mockResolvedValue({
        Body: readable,
        ContentType: 'application/pdf',
      });

      const result = await provider.get('documents/file.pdf');

      expect(result.body).toBe(readable);
      expect(result.contentType).toBe('application/pdf');
    });

    it('defaults contentType to application/octet-stream', async () => {
      const readable = new Readable({ read() { this.push(null); } });
      s3Client.send.mockResolvedValue({
        Body: readable,
        ContentType: undefined,
      });

      const result = await provider.get('documents/file.bin');

      expect(result.contentType).toBe('application/octet-stream');
    });

    it('throws StorageFileNotFoundError on NoSuchKey', async () => {
      const error = new Error('Not found');
      Object.defineProperty(error, 'name', { value: 'NoSuchKey' });
      s3Client.send.mockRejectedValue(error);

      await expect(provider.get('missing/file.pdf')).rejects.toThrow(StorageFileNotFoundError);
    });

    it('throws StorageReadError on other failures', async () => {
      s3Client.send.mockRejectedValue(new Error('Access denied'));

      await expect(provider.get('documents/file.pdf')).rejects.toThrow(StorageReadError);
    });
  });

  describe('getPresignedPutUrl', () => {
    it('returns URL from getSignedUrl', async () => {
      mockGetSignedUrl.mockResolvedValue('https://s3.example.com/presigned-put');

      const result = await provider.getPresignedPutUrl('key.pdf', 'application/pdf');

      expect(result).toBe('https://s3.example.com/presigned-put');
    });

    it('defaults expiresIn to 900', async () => {
      mockGetSignedUrl.mockResolvedValue('https://s3.example.com/presigned-put');

      await provider.getPresignedPutUrl('key.pdf', 'application/pdf');

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 900 },
      );
    });

    it('passes custom expiresIn', async () => {
      mockGetSignedUrl.mockResolvedValue('https://s3.example.com/presigned-put');

      await provider.getPresignedPutUrl('key.pdf', 'application/pdf', 3600);

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 3600 },
      );
    });
  });

  describe('getPresignedGetUrl', () => {
    it('returns URL from getSignedUrl', async () => {
      mockGetSignedUrl.mockResolvedValue('https://s3.example.com/presigned-get');

      const result = await provider.getPresignedGetUrl('key.pdf');

      expect(result).toBe('https://s3.example.com/presigned-get');
    });

    it('defaults expiresIn to 900', async () => {
      mockGetSignedUrl.mockResolvedValue('https://s3.example.com/presigned-get');

      await provider.getPresignedGetUrl('key.pdf');

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 900 },
      );
    });
  });

  describe('delete', () => {
    it('resolves on success', async () => {
      s3Client.send.mockResolvedValue({});

      await expect(provider.delete('documents/file.pdf')).resolves.toBeUndefined();
    });

    it('does not throw on NoSuchKey (idempotent)', async () => {
      const error = new Error('Not found');
      Object.defineProperty(error, 'name', { value: 'NoSuchKey' });
      s3Client.send.mockRejectedValue(error);

      await expect(provider.delete('missing/file.pdf')).resolves.toBeUndefined();
    });

    it('throws StorageDeleteError on other failures', async () => {
      s3Client.send.mockRejectedValue(new Error('Permission denied'));

      await expect(provider.delete('documents/file.pdf')).rejects.toThrow(StorageDeleteError);
    });
  });

  describe('exists', () => {
    it('returns true when HeadObject succeeds', async () => {
      s3Client.send.mockResolvedValue({});

      const result = await provider.exists('documents/file.pdf');

      expect(result).toBe(true);
    });

    it('returns false on NotFound', async () => {
      const error = new Error('Not found');
      Object.defineProperty(error, 'name', { value: 'NotFound' });
      s3Client.send.mockRejectedValue(error);

      const result = await provider.exists('missing/file.pdf');

      expect(result).toBe(false);
    });

    it('returns false on NoSuchKey', async () => {
      const error = new Error('No such key');
      Object.defineProperty(error, 'name', { value: 'NoSuchKey' });
      s3Client.send.mockRejectedValue(error);

      const result = await provider.exists('missing/file.pdf');

      expect(result).toBe(false);
    });
  });

  describe('deleteMany', () => {
    it('no-ops on empty array', async () => {
      await provider.deleteMany([]);

      expect(s3Client.send).not.toHaveBeenCalled();
    });

    it('sends DeleteObjectsCommand with correct keys', async () => {
      s3Client.send.mockResolvedValue({});

      await provider.deleteMany(['file1.pdf', 'file2.pdf']);

      expect(s3Client.send).toHaveBeenCalledTimes(1);
      const command = s3Client.send.mock.calls[0][0] as {
        input: { Bucket: string; Delete: { Objects: { Key: string }[]; Quiet: boolean } };
      };
      expect(command.input.Bucket).toBe(BUCKET);
      expect(command.input.Delete.Objects).toEqual([{ Key: 'file1.pdf' }, { Key: 'file2.pdf' }]);
      expect(command.input.Delete.Quiet).toBe(true);
    });

    it('throws StorageDeleteError on failure', async () => {
      s3Client.send.mockRejectedValue(new Error('Batch delete failed'));

      await expect(provider.deleteMany(['file1.pdf'])).rejects.toThrow(StorageDeleteError);
    });
  });

  describe('deleteByPrefix', () => {
    it('returns deletedCount 0 when no files found', async () => {
      s3Client.send.mockResolvedValue({ Contents: [], IsTruncated: false });

      const result = await provider.deleteByPrefix('empty-prefix/');

      expect(result).toEqual({ deletedCount: 0 });
    });

    it('lists then deletes and returns correct count', async () => {
      // First call: ListObjectsV2Command returns keys
      s3Client.send
        .mockResolvedValueOnce({
          Contents: [{ Key: 'prefix/a.pdf' }, { Key: 'prefix/b.pdf' }],
          IsTruncated: false,
        })
        // Second call: DeleteObjectsCommand succeeds
        .mockResolvedValueOnce({});

      const result = await provider.deleteByPrefix('prefix/');

      expect(result).toEqual({ deletedCount: 2 });
      expect(s3Client.send).toHaveBeenCalledTimes(2);
    });

    it('throws StorageDeleteError on failure', async () => {
      s3Client.send
        .mockResolvedValueOnce({
          Contents: [{ Key: 'prefix/a.pdf' }],
          IsTruncated: false,
        })
        .mockRejectedValueOnce(new Error('Delete batch failed'));

      await expect(provider.deleteByPrefix('prefix/')).rejects.toThrow(StorageDeleteError);
    });
  });

  describe('list', () => {
    it('returns keys for given prefix', async () => {
      s3Client.send.mockResolvedValue({
        Contents: [{ Key: 'org/file1.pdf' }, { Key: 'org/file2.pdf' }],
        IsTruncated: false,
      });

      const result = await provider.list('org/');

      expect(result).toEqual(['org/file1.pdf', 'org/file2.pdf']);
    });

    it('handles pagination with multiple pages', async () => {
      s3Client.send
        .mockResolvedValueOnce({
          Contents: [{ Key: 'org/file1.pdf' }],
          IsTruncated: true,
          NextContinuationToken: 'token-1',
        })
        .mockResolvedValueOnce({
          Contents: [{ Key: 'org/file2.pdf' }],
          IsTruncated: false,
        });

      const result = await provider.list('org/');

      expect(result).toEqual(['org/file1.pdf', 'org/file2.pdf']);
      expect(s3Client.send).toHaveBeenCalledTimes(2);
    });

    it('returns empty array for nonexistent prefix', async () => {
      s3Client.send.mockResolvedValue({ Contents: [], IsTruncated: false });

      const result = await provider.list('nonexistent/');

      expect(result).toEqual([]);
    });
  });
});
