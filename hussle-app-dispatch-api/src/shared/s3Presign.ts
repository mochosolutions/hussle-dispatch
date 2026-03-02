import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/s3';
import { ValidationError } from './errors';

const PRESIGN_EXPIRY_SECONDS = 900; // 15 minutes

const ACCEPTED_CONTENT_TYPES = new Set(['application/pdf', 'image/png', 'image/jpg', 'image/jpeg']);

const MAX_SIZE_BY_CONTENT_TYPE: Record<string, number> = {
  'application/pdf': 5 * 1024 * 1024, // 5 MB
  'image/png': 10 * 1024 * 1024, // 10 MB
  'image/jpg': 10 * 1024 * 1024, // 10 MB
  'image/jpeg': 10 * 1024 * 1024, // 10 MB
};

export interface PresignedPutResult {
  url: string;
  key: string;
  expiresAt: Date;
}

export interface PresignPutInput {
  bucket: string;
  key: string;
  contentType: string;
  maxSize: number;
}

/**
 * Generates a pre-signed S3 PUT URL for uploading a document.
 *
 * @returns { url, key, expiresAt } — the signed URL expires in 15 minutes
 */
export const generatePresignedPutUrl = async ({
  bucket,
  key,
  contentType,
  maxSize,
}: PresignPutInput): Promise<PresignedPutResult> => {
  if (!ACCEPTED_CONTENT_TYPES.has(contentType)) {
    throw new ValidationError(
      `Unsupported content type: ${contentType}. Accepted types: PDF, PNG, JPG, JPEG.`,
    );
  }

  const typeMaxSize = MAX_SIZE_BY_CONTENT_TYPE[contentType];
  if (typeMaxSize === undefined || maxSize > typeMaxSize) {
    throw new ValidationError(
      `File size ${maxSize} exceeds maximum allowed size ${typeMaxSize ?? 0} for ${contentType}.`,
    );
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: maxSize,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGN_EXPIRY_SECONDS,
  });

  const expiresAt = new Date(Date.now() + PRESIGN_EXPIRY_SECONDS * 1000);

  return { url, key, expiresAt };
};

export interface LoadDocumentKeyInput {
  orgId: string;
  loadId: string;
  type: string;
  filename: string;
}

/**
 * Builds an S3 key for a load document.
 * Pattern: {orgId}/loads/{loadId}/{type}/{filename}
 */
export const buildLoadDocumentKey = ({
  orgId,
  loadId,
  type,
  filename,
}: LoadDocumentKeyInput): string => `${orgId}/loads/${loadId}/${type}/${filename}`;

export interface CarrierDocumentKeyInput {
  orgId: string;
  carrierId: string;
  type: string;
  filename: string;
}

/**
 * Builds an S3 key for a carrier document.
 * Pattern: {orgId}/carriers/{carrierId}/{type}/{filename}
 */
export const buildCarrierDocumentKey = ({
  orgId,
  carrierId,
  type,
  filename,
}: CarrierDocumentKeyInput): string => `${orgId}/carriers/${carrierId}/${type}/${filename}`;
