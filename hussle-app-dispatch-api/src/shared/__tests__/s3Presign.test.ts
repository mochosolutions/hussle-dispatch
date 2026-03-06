import { ValidationError } from '../errors';
import { buildCarrierDocumentKey, buildLoadDocumentKey, generatePresignedPutUrl } from '../s3Presign';

// Mock @aws-sdk modules before importing the module under test
jest.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: jest.fn().mockImplementation((input: unknown) => ({ input })),
  S3Client: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
}));

jest.mock('../../config/s3', () => ({
  s3Client: {},
}));

describe('generatePresignedPutUrl', () => {
  it('returns url, key, and expiresAt for a valid PDF', async () => {
    const result = await generatePresignedPutUrl({
      bucket: 'my-bucket',
      key: 'org1/loads/load1/bol/document.pdf',
      contentType: 'application/pdf',
      maxSize: 1024 * 1024,
    });

    expect(result.url).toBe('https://s3.example.com/presigned-url');
    expect(result.key).toBe('org1/loads/load1/bol/document.pdf');
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('sets expiresAt approximately 15 minutes in the future', async () => {
    const before = Date.now();

    const result = await generatePresignedPutUrl({
      bucket: 'my-bucket',
      key: 'org1/loads/load1/bol/document.pdf',
      contentType: 'application/pdf',
      maxSize: 1024 * 1024,
    });

    const after = Date.now();
    const fifteenMinutesMs = 15 * 60 * 1000;

    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before + fifteenMinutesMs - 100);
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after + fifteenMinutesMs + 100);
  });

  it('throws ValidationError for unsupported content type', async () => {
    await expect(
      generatePresignedPutUrl({
        bucket: 'bucket',
        key: 'key',
        contentType: 'application/zip',
        maxSize: 1024,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when maxSize exceeds PDF limit of 5MB', async () => {
    const sixMB = 6 * 1024 * 1024;

    await expect(
      generatePresignedPutUrl({
        bucket: 'bucket',
        key: 'key',
        contentType: 'application/pdf',
        maxSize: sixMB,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when maxSize exceeds image limit of 10MB', async () => {
    const elevenMB = 11 * 1024 * 1024;

    await expect(
      generatePresignedPutUrl({
        bucket: 'bucket',
        key: 'key',
        contentType: 'image/png',
        maxSize: elevenMB,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('accepts image/png within 10MB limit', async () => {
    const result = await generatePresignedPutUrl({
      bucket: 'bucket',
      key: 'org1/carriers/c1/insurance/cert.png',
      contentType: 'image/png',
      maxSize: 5 * 1024 * 1024,
    });

    expect(result.url).toBeDefined();
  });

  it('accepts image/jpeg within 10MB limit', async () => {
    const result = await generatePresignedPutUrl({
      bucket: 'bucket',
      key: 'org1/loads/l1/bol/photo.jpeg',
      contentType: 'image/jpeg',
      maxSize: 8 * 1024 * 1024,
    });

    expect(result.url).toBeDefined();
  });
});

describe('buildLoadDocumentKey', () => {
  it('builds key with correct pattern', () => {
    const key = buildLoadDocumentKey({
      orgId: 'org1',
      loadId: 'load1',
      type: 'bol',
      filename: 'signed.pdf',
    });

    expect(key).toBe('org1/loads/load1/bol/signed.pdf');
  });
});

describe('buildCarrierDocumentKey', () => {
  it('builds key with correct pattern', () => {
    const key = buildCarrierDocumentKey({
      orgId: 'org1',
      carrierId: 'carrier1',
      type: 'insurance',
      filename: 'cert.pdf',
    });

    expect(key).toBe('org1/carriers/carrier1/insurance/cert.pdf');
  });
});
