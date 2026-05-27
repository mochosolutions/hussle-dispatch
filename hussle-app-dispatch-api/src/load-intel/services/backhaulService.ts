import type { Logger } from '../../shared/utils/logger';
import type { LoadIntelRedisPort } from '../types/loadIntelPorts';
import type { LoadIntelRedis } from '../types/loadIntelTypes';
import type { BackhaulSearchInput, BackhaulGeoPort, BackhaulSearchResult } from '../types/backhaulTypes';

const MAX_BACKHAUL_RESULTS = 20;

interface BackhaulServiceDeps {
  redisPort: LoadIntelRedisPort;
  geoPort: BackhaulGeoPort;
  logger: Logger;
}

/**
 * Calculates the distance in miles between two coordinate points using the haversine formula.
 */
const haversineDistanceFromCoords = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number => {
  const earthRadiusMiles = 3959;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
};

/**
 * Searches for backhaul loads originating within a radius of a given city/state.
 * Scans the Redis feed for loads whose origin is within radius miles.
 */
export const searchBackhaul = async (
  orgId: string,
  input: BackhaulSearchInput,
  deps: BackhaulServiceDeps,
): Promise<BackhaulSearchResult> => {
  const fromCoords = await deps.geoPort.getCityCoords(input.fromState, input.fromCity);

  if (fromCoords === null) {
    deps.logger.warn('Backhaul search: origin city not found in geo data', {
      orgId,
      fromCity: input.fromCity,
      fromState: input.fromState,
    });
    return { data: [], total: 0 };
  }

  const feedKey = `intel:feed:${orgId}`;
  const dismissedKey = `intel:dismissed:${orgId}`;

  // Fetch all hashes from the feed
  const allHashes = await deps.redisPort.zrevrange(feedKey, 0, -1);

  const matched: LoadIntelRedis[] = [];

  for (const hash of allHashes) {
    if (matched.length >= MAX_BACKHAUL_RESULTS) {
      break;
    }

    const isDismissed = await deps.redisPort.sismember(dismissedKey, hash);

    if (isDismissed) {
      continue;
    }

    const redisKey = `intel:${orgId}:${hash}`;
    const raw = await deps.redisPort.get(redisKey);

    if (raw === null) {
      await deps.redisPort.zrem(feedKey, hash);
      continue;
    }

    const record = JSON.parse(raw) as LoadIntelRedis;

    // Filter: pickupDate >= earliestPickup
    if (record.payload.pickupDate < input.earliestPickup) {
      continue;
    }

    // Check origin is within radius
    const originCoords = await deps.geoPort.getCityCoords(
      record.payload.origin.state,
      record.payload.origin.city,
    );

    if (originCoords === null) {
      continue;
    }

    const distanceFromOrigin = haversineDistanceFromCoords(fromCoords, originCoords);

    if (distanceFromOrigin <= input.radius) {
      matched.push(record);
    }
  }

  // Sort by composite score descending
  matched.sort((a, b) => b.bestScore - a.bestScore);

  deps.logger.info('Backhaul search completed', {
    orgId,
    fromCity: input.fromCity,
    fromState: input.fromState,
    radius: input.radius,
    resultsFound: matched.length,
  });

  return {
    data: matched.slice(0, MAX_BACKHAUL_RESULTS),
    total: matched.length,
  };
};
