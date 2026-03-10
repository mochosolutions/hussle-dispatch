import type Redis from 'ioredis';
import { getCityCoords, haversineDistance } from '../../shared/geoLookup';
import type { BackhaulGeoPort } from '../types/backhaulTypes';

/**
 * Adapter for backhaul geo operations using Redis-stored city coordinates.
 */
export const createBackhaulGeoAdapter = (redis: Redis): BackhaulGeoPort => ({
  getCityCoords: (state: string, city: string) =>
    getCityCoords(redis, state, city),

  getDistanceMiles: async (
    from: { city: string; state: string },
    to: { city: string; state: string },
  ): Promise<number> => {
    const fromCoords = await getCityCoords(redis, from.state, from.city);
    const toCoords = await getCityCoords(redis, to.state, to.city);

    if (fromCoords === null || toCoords === null) {
      return 500; // Default when geo data is unavailable
    }

    return Math.round(haversineDistance({ from: fromCoords, to: toCoords }));
  },
});
