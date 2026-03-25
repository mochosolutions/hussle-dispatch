import type { LoadIntelRedis } from './loadIntelTypes';
import type { ChainScoreResult } from '../../shared/scoring/calculateChainScore';

/**
 * Input for backhaul search.
 */
export interface BackhaulSearchInput {
  fromCity: string;
  fromState: string;
  radius: number;
  earliestPickup: string;
}

/**
 * A single chain step (outbound, intermediate, or backhaul).
 */
export interface ChainStep {
  loadHash: string;
  origin: { city: string; state: string };
  dest: { city: string; state: string };
  rate?: number;
  loadedMiles?: number;
  compositeScore: number;
}

/**
 * A complete chain assembly (2 or 3 steps).
 */
export interface LoadChain {
  steps: ChainStep[];
  totalMiles: number;
  totalRate: number;
  chainScore: number;
  chainScoreResult?: ChainScoreResult;
}

/**
 * Result of a backhaul search.
 */
export interface BackhaulSearchResult {
  data: LoadIntelRedis[];
  total: number;
}

/**
 * Port for backhaul geo/distance operations.
 */
export interface BackhaulGeoPort {
  getCityCoords(state: string, city: string): Promise<{ lat: number; lng: number } | null>;
  getDistanceMiles(
    from: { city: string; state: string },
    to: { city: string; state: string },
  ): Promise<number>;
}
