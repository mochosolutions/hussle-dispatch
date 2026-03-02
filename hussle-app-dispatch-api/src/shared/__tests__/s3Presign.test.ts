import { ValidationError } from '../errors';
import { buildCarrierDocumentKey, buildLoadDocumentKey } from '../s3Presign';

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

// Import after mocks are in place
// eslint-disable-next-line import/first
import { generatePresignedPutUrl } from '../s3Presign';

describe('generatePresignedPutUrl', () => {
  it('returns url, key, and expiresAt for a valid PDF', async () => {
    const result = await generatePresignedPutUrl(
      'my-bucket',
      'org1/loads/load1/bol/document.pdf',
      'application/pdf',
      1024 * 1024,
    );

    expect(result.url).toBe('https://s3.example.com/presigned-url');
    expect(result.key).toBe('org1/loads/load1/bol/document.pdf');
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('sets expiresAt approximately 15 minutes in the future', async () => {
    const before = Date.now();

    const result = await generatePresignedPutUrl(
      'my-bucket',
      'org1/loads/load1/bol/document.pdf',
      'application/pdf',
      1024 * 1024,
    );

    const after = Date.now();
    const fifteenMinutesMs = 15 * 60 * 1000;

    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before + fifteenMinutesMs - 100);
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after + fifteenMinutesMs + 100);
  });

  it('throws ValidationError for unsupported content type', async () => {
    await expect(
      generatePresignedPutUrl('bucket', 'key', 'application/zip', 1024),
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when maxSize exceeds PDF limit of 5MB', async () => {
    const sixMB = 6 * 1024 * 1024;

    await expect(
      generatePresignedPutUrl('bucket', 'key', 'application/pdf', sixMB),
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when maxSize exceeds image limit of 10MB', async () => {
    const elevenMB = 11 * 1024 * 1024;

    await expect(
      generatePresignedPutUrl('bucket', 'key', 'image/png', elevenMB),
    ).rejects.toThrow(ValidationError);
  });

  it('accepts image/png within 10MB limit', async () => {
    const result = await generatePresignedPutUrl(
      'bucket',
      'org1/carriers/c1/insurance/cert.png',
      'image/png',
      5 * 1024 * 1024,
    );

    expect(result.url).toBeDefined();
  });

  it('accepts image/jpeg within 10MB limit', async () => {
    const result = await generatePresignedPutUrl(
      'bucket',
      'org1/loads/l1/bol/photo.jpeg',
      'image/jpeg',
      8 * 1024 * 1024,
    );

    expect(result.url).toBeDefined();
  });
});

describe('buildLoadDocumentKey', () => {
  it('builds key with correct pattern', () => {
    const key = buildLoadDocumentKey('org1', 'load1', 'bol', 'signed.pdf');

    expect(key).toBe('org1/loads/load1/bol/signed.pdf');
  });
});

describe('buildCarrierDocumentKey', () => {
  it('builds key with correct pattern', () => {
    const key = buildCarrierDocumentKey('org1', 'carrier1', 'insurance', 'cert.pdf');

    expect(key).toBe('org1/carriers/carrier1/insurance/cert.pdf');
  });
});
