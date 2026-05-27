import type { MarketTier } from '../../shared/constants/marketTiers';
import type { FleetUnit, GeoPoint } from './loadIntelTypes';

/**
 * Port for Redis operations used by the load intel service.
 */
export interface LoadIntelRedisPort {
  exists(key: string): Promise<boolean>;
  setWithTtl(key: string, value: string, ttlSeconds: number): Promise<void>;
  zadd(key: string, score: number, member: string): Promise<void>;
  zrevrange(key: string, start: number, stop: number): Promise<string[]>;
  zcard(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  sismember(key: string, member: string): Promise<boolean>;
  sadd(key: string, member: string): Promise<void>;
  zrem(key: string, member: string): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * Port for querying active fleet units (vehicles + drivers) for scoring.
 */
export interface FleetQueryPort {
  getActiveFleetUnits(orgId: string): Promise<FleetUnit[]>;
}

/**
 * Port for market data lookups.
 */
export interface MarketDataPort {
  getMarketTier(state: string, city: string): Promise<MarketTier>;
  getDistanceMiles(from: GeoPoint, to: GeoPoint): Promise<number>;
}
