const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getEnv = (key: string, defaultValue: string): string =>
  process.env[key] ?? defaultValue;

export const env = {
  PORT: parseInt(getEnv('PORT', '3001'), 10),
  NODE_ENV: getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  DATABASE_URL: requireEnv('DATABASE_URL'),
  REDIS_URL: getEnv('REDIS_URL', 'redis://localhost:6379'),
  S3_BUCKET: getEnv('S3_BUCKET', ''),
  AWS_REGION: getEnv('AWS_REGION', 'us-east-1'),
  AWS_ACCESS_KEY_ID: getEnv('AWS_ACCESS_KEY_ID', ''),
  AWS_SECRET_ACCESS_KEY: getEnv('AWS_SECRET_ACCESS_KEY', ''),
  SES_FROM_EMAIL: getEnv('SES_FROM_EMAIL', ''),
} as const;
