import type Redis from 'ioredis';
import { MARKET_TIERS } from '../../shared/constants/marketTiers';
import type { MarketTier } from '../../shared/constants/marketTiers';
import { getCityCoords, haversineDistance } from '../../shared/geoLookup';
import type { MarketDataPort } from '../types/loadIntelPorts';
import type { GeoPoint } from '../types/loadIntelTypes';

/**
 * Known strong and moderate freight markets for stub scoring.
 * In production this would be replaced by a DAT/Greenscreens API integration.
 */
const STRONG_MARKETS = new Set([
  'TX:dallas',
  'TX:houston',
  'TX:san antonio',
  'CA:los angeles',
  'CA:ontario',
  'IL:chicago',
  'GA:atlanta',
  'PA:philadelphia',
  'OH:columbus',
  'TN:memphis',
  'IN:indianapolis',
  'NJ:elizabeth',
  'FL:jacksonville',
]);

const MODERATE_MARKETS = new Set([
  'MO:kansas city',
  'MO:st louis',
  'NC:charlotte',
  'WI:milwaukee',
  'MI:detroit',
  'VA:richmond',
  'AZ:phoenix',
  'WA:seattle',
  'CO:denver',
  'MN:minneapolis',
  'KY:louisville',
  'SC:greenville',
  'AL:birmingham',
]);

/**
 * Stub market data adapter.
 * Uses a static lookup for market tiers and Redis geo data for distance.
 * Replace with a real market data API when available.
 */
export const createMarketDataAdapter = (redis: Redis): MarketDataPort => ({
  getMarketTier: async (state: string, city: string): Promise<MarketTier> => {
    const key = `${state.toUpperCase()}:${city.toLowerCase()}`;

    if (STRONG_MARKETS.has(key)) {
      return MARKET_TIERS.STRONG;
    }

    if (MODERATE_MARKETS.has(key)) {
      return MARKET_TIERS.MODERATE;
    }

    // Check if the city is at least known in geo data
    const coords = await getCityCoords(redis, state, city);

    if (coords === null) {
      return MARKET_TIERS.UNKNOWN;
    }

    return MARKET_TIERS.WEAK;
  },

  getDistanceMiles: async (fromPoint: GeoPoint, toPoint: GeoPoint): Promise<number> => {
    const from = await getCityCoords(redis, fromPoint.state, fromPoint.city);
    const to = await getCityCoords(redis, toPoint.state, toPoint.city);

    if (from === null || to === null) {
      // Fallback: return a default distance when geo data is unavailable
      return 500;
    }

    return Math.round(haversineDistance({ from, to }));
  },
});
