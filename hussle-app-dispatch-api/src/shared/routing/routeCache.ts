import crypto from 'node:crypto';
import type { Redis } from 'ioredis';
import type { Logger } from '@/shared/utils/logger';
import type { RouteCalculatorPort } from './routeCalculatorPort';
import type { Coordinates, RouteResult } from './types';

const DEFAULT_TTL_SECONDS = 2592000; // 30 days

interface CachedRouteCalculatorDeps {
  inner: RouteCalculatorPort;
  redis: Redis;
  logger: Logger;
  ttlSeconds?: number;
}

const roundCoord = (value: number, decimals: number): number =>
  Math.round(value * 10 ** decimals) / 10 ** decimals;

const buildCacheKey = (waypoints: Coordinates[]): string => {
  const normalized = waypoints.map((w) => [roundCoord(w.lat, 5), roundCoord(w.lng, 5)]);
  const hash = crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  return `route:${hash}`;
};

export const createCachedRouteCalculator = (
  deps: CachedRouteCalculatorDeps,
): RouteCalculatorPort => {
  const { inner, redis, logger, ttlSeconds = DEFAULT_TTL_SECONDS } = deps;

  return {
    calculateRoute: async (waypoints: Coordinates[]): Promise<RouteResult> => {
      const key = buildCacheKey(waypoints);

      try {
        const cached = await redis.get(key);
        if (cached !== null) {
          logger.debug('Route cache hit', { key });
          return JSON.parse(cached) as RouteResult;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown Redis error';
        logger.warn('Route cache get failed, falling through to calculator', { key, error: message });
      }

      const result = await inner.calculateRoute(waypoints);

      try {
        await redis.set(key, JSON.stringify(result), 'EX', ttlSeconds);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown Redis error';
        logger.warn('Route cache set failed', { key, error: message });
      }

      return result;
    },
  };
};
