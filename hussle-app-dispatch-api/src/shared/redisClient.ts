import Redis from 'ioredis';
import { env } from '../config/env';

/**
 * Singleton Redis client configured from REDIS_URL environment variable.
 * Uses ioredis with lazy connect to avoid blocking startup if Redis is unavailable.
 */
const createRedisClient = (): Redis => {
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });

  client.on('error', (error: unknown) => {
    if (isErrorWithMessage(error)) {
      process.stderr.write(`[Redis] Connection error: ${error.message}\n`);
    }
  });

  return client;
};

const isErrorWithMessage = (error: unknown): error is { message: string } =>
  typeof error === 'object' && error !== null && 'message' in error;

export const redisClient = createRedisClient();
