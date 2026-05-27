import type Redis from 'ioredis';
import type { LoadIntelRedisPort } from '../types/loadIntelPorts';

/**
 * Redis adapter implementing LoadIntelRedisPort.
 * Wraps ioredis calls for load intel storage and dedup.
 */
export const createLoadIntelRedisAdapter = (redis: Redis): LoadIntelRedisPort => ({
  exists: async (key: string): Promise<boolean> => {
    const result = await redis.exists(key);
    return result === 1;
  },

  setWithTtl: async (key: string, value: string, ttlSeconds: number): Promise<void> => {
    await redis.set(key, value, 'EX', ttlSeconds);
  },

  zadd: async (key: string, score: number, member: string): Promise<void> => {
    await redis.zadd(key, score, member);
  },

  zrevrange: async (key: string, start: number, stop: number): Promise<string[]> =>
    redis.zrevrange(key, start, stop),

  zcard: async (key: string): Promise<number> =>
    redis.zcard(key),

  get: async (key: string): Promise<string | null> =>
    redis.get(key),

  sismember: async (key: string, member: string): Promise<boolean> => {
    const result = await redis.sismember(key, member);
    return result === 1;
  },

  sadd: async (key: string, member: string): Promise<void> => {
    await redis.sadd(key, member);
  },

  zrem: async (key: string, member: string): Promise<void> => {
    await redis.zrem(key, member);
  },

  del: async (key: string): Promise<void> => {
    await redis.del(key);
  },
});
