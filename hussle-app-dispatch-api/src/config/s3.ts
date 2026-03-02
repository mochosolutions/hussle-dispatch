import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

/**
 * S3 client singleton configured with AWS_REGION.
 * Credentials are sourced from environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * via the default AWS credential provider chain.
 */
export const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials:
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});
