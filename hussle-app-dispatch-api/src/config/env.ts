import { MissingEnvError } from '@/shared/errors/missingEnvError';

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new MissingEnvError(key);
  }
  return value;
};

const getEnv = (key: string, defaultValue: string): string =>
  process.env[key] ?? defaultValue;

/**
 * Require an env var only when running in production. In dev/test it falls
 * back to an empty string so local workflows and `npm test` keep working.
 */
const requireInProd = (key: string): string =>
  process.env['NODE_ENV'] === 'production' ? requireEnv(key) : getEnv(key, '');

export const env = {
  PORT: parseInt(getEnv('PORT', '3001'), 10),
  NODE_ENV: getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  ENVIRONMENT_NAME: getEnv('ENVIRONMENT_NAME', 'unknown') as
    | 'local'
    | 'dev'
    | 'staging'
    | 'prod'
    | 'production'
    | 'unknown',
  DATABASE_URL: requireEnv('DATABASE_URL'),
  REDIS_URL: getEnv('REDIS_URL', 'redis://localhost:6379'),
  RABBITMQ_URL: getEnv('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  REFRESH_SECRET: requireEnv('REFRESH_SECRET'),
  COGNITO_CLIENT_ID: requireInProd('COGNITO_CLIENT_ID'),
  COGNITO_USER_POOL_ID: requireInProd('COGNITO_USER_POOL_ID'),
  S3_BUCKET: requireInProd('S3_BUCKET'),
  AWS_REGION: requireInProd('AWS_REGION'),
  AWS_ACCESS_KEY_ID: requireInProd('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: requireInProd('AWS_SECRET_ACCESS_KEY'),
  SES_FROM_EMAIL: requireInProd('SES_FROM_EMAIL'),
  STORAGE_BACKEND: requireInProd('STORAGE_BACKEND') as 'local' | 's3',
  STORAGE_LOCAL_PATH: getEnv('STORAGE_LOCAL_PATH', './storage'),
  ROUTE_CALCULATOR_ENABLED: getEnv('ROUTE_CALCULATOR_ENABLED', 'true') === 'true',
  AWS_LOCATION_MAP_NAME: getEnv('AWS_LOCATION_MAP_NAME', ''),
  FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:5173'),
  TRACKING_BASE_URL: getEnv('TRACKING_BASE_URL', 'http://localhost:5173'),
  PUBLIC_SHORT_BASE_URL: getEnv('PUBLIC_SHORT_BASE_URL', 'http://localhost:3001'),
  ALLOWED_EXTENSION_IDS: getEnv('ALLOWED_EXTENSION_IDS', ''),
  SMTP_HOST: getEnv('SMTP_HOST', 'localhost'),
  SMTP_PORT: parseInt(getEnv('SMTP_PORT', '1025'), 10),
  SMTP_USER: getEnv('SMTP_USER', ''),
  SMTP_PASS: getEnv('SMTP_PASS', ''),
  SMTP_SECURE: getEnv('SMTP_SECURE', 'false') === 'true',
  SMS_BACKEND: requireInProd('SMS_BACKEND') as 'console' | 'twilio',
  FMCSA_PROVIDER: getEnv('FMCSA_PROVIDER', 'mock') as 'mock' | 'safer-web',
  SIGNATURE_PROVIDER: getEnv('SIGNATURE_PROVIDER', 'mock') as 'mock' | 'docuseal',
  DOCUSEAL_BASE_URL: getEnv('DOCUSEAL_BASE_URL', ''),
  DOCUSEAL_API_KEY: getEnv('DOCUSEAL_API_KEY', ''),
  DOCUSEAL_WEBHOOK_SECRET: getEnv('DOCUSEAL_WEBHOOK_SECRET', ''),
  DOCUSEAL_DISPATCH_TEMPLATE_ID: parseInt(getEnv('DOCUSEAL_DISPATCH_TEMPLATE_ID', '0'), 10),
  AGREEMENT_WATCHDOG_INTERVAL_MIN: parseInt(getEnv('AGREEMENT_WATCHDOG_INTERVAL_MIN', '5'), 10),
  AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN: parseInt(
    getEnv('AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN', '10'),
    10,
  ),
  TWILIO_ACCOUNT_SID: requireInProd('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: requireInProd('TWILIO_AUTH_TOKEN'),
  TWILIO_FROM_NUMBER: requireInProd('TWILIO_FROM_NUMBER'),
} as const;
