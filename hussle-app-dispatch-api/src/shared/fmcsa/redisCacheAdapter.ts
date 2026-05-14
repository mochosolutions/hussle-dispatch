import type { Logger } from '@/shared/utils/logger';
import type { CachePort } from './cachePort';
import type { FmcsaSnapshot } from './types';

export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttl: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

interface RedisCacheAdapterDeps {
  redis: RedisLike;
  logger: Logger;
}

const isString = (v: unknown): v is string => typeof v === 'string';

const isStringOrNull = (v: unknown): v is string | null =>
  v === null || typeof v === 'string';

const isNumberOrNull = (v: unknown): v is number | null =>
  v === null || typeof v === 'number';

const isAuthorityStatus = (v: unknown): v is FmcsaSnapshot['authorityStatus'] =>
  v === 'ACTIVE' || v === 'INACTIVE' || v === 'NOT_AUTHORIZED';

const isSafetyRating = (v: unknown): v is FmcsaSnapshot['safetyRating'] =>
  v === null ||
  v === 'SATISFACTORY' ||
  v === 'CONDITIONAL' ||
  v === 'UNSATISFACTORY' ||
  v === 'UNRATED';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const reviveSnapshot = (raw: string): FmcsaSnapshot | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) {
    return null;
  }
  const mcNumber = parsed['mcNumber'];
  const dotNumber = parsed['dotNumber'];
  const legalName = parsed['legalName'];
  const dba = parsed['dba'];
  const address = parsed['address'];
  const authorityStatus = parsed['authorityStatus'];
  const safetyRating = parsed['safetyRating'];
  const fleetSize = parsed['fleetSize'];
  const officerName = parsed['officerName'];
  const lastCheckedAt = parsed['lastCheckedAt'];
  const rawField = parsed['raw'];

  if (!isString(mcNumber)) {
    return null;
  }
  if (!isStringOrNull(dotNumber)) {
    return null;
  }
  if (!isString(legalName)) {
    return null;
  }
  if (!isStringOrNull(dba)) {
    return null;
  }
  if (!isStringOrNull(address)) {
    return null;
  }
  if (!isAuthorityStatus(authorityStatus)) {
    return null;
  }
  if (!isSafetyRating(safetyRating)) {
    return null;
  }
  if (!isNumberOrNull(fleetSize)) {
    return null;
  }
  if (!isStringOrNull(officerName)) {
    return null;
  }
  if (!isString(lastCheckedAt) && typeof lastCheckedAt !== 'number') {
    return null;
  }
  if (!isRecord(rawField)) {
    return null;
  }

  return {
    mcNumber,
    dotNumber,
    legalName,
    dba,
    address,
    authorityStatus,
    safetyRating,
    fleetSize,
    officerName,
    lastCheckedAt: new Date(lastCheckedAt),
    raw: rawField,
  };
};

export const createRedisCacheAdapter = (deps: RedisCacheAdapterDeps): CachePort => {
  const { redis, logger } = deps;

  return {
    get: async (key: string): Promise<FmcsaSnapshot | null> => {
      try {
        const raw = await redis.get(key);
        if (raw === null) {
          return null;
        }
        return reviveSnapshot(raw);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown Redis error';
        logger.warn('FMCSA cache get failed', { key, error: message });
        return null;
      }
    },

    set: async (key: string, value: FmcsaSnapshot, ttlSeconds: number): Promise<void> => {
      try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown Redis error';
        logger.warn('FMCSA cache set failed', { key, error: message });
      }
    },

    del: async (key: string): Promise<void> => {
      try {
        await redis.del(key);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown Redis error';
        logger.warn('FMCSA cache del failed', { key, error: message });
      }
    },
  };
};
