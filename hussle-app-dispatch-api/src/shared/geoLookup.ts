import type Redis from 'ioredis';

const GEO_CITIES_KEY = 'geo:cities';
const EARTH_RADIUS_MILES = 3959;

export interface CityCoords {
  lat: number;
  lng: number;
}

/**
 * Looks up city centroid coordinates from the Redis geo:cities hash.
 *
 * @param redis - The Redis client instance
 * @param state - Two-letter state abbreviation (e.g. 'TX')
 * @param city - City name (case-insensitive)
 * @returns { lat, lng } or null if not found
 *
 * Redis field format: '{STATE}:{city_lowercase}' — e.g. 'TX:houston'
 */
export const getCityCoords = async (
  redis: Redis,
  state: string,
  city: string,
): Promise<CityCoords | null> => {
  const field = `${state.toUpperCase()}:${city.toLowerCase()}`;
  const value = await redis.hget(GEO_CITIES_KEY, field);

  if (value === null) {
    return null;
  }

  const parts = value.split(',');
  if (parts.length !== 2) {
    return null;
  }

  const lat = parseFloat(parts[0] ?? '');
  const lng = parseFloat(parts[1] ?? '');

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

export interface HaversineInput {
  from: CityCoords;
  to: CityCoords;
}

/**
 * Calculates the great-circle distance between two coordinates using the Haversine formula.
 *
 * @returns Distance in miles (R = 3959)
 */
export const haversineDistance = ({ from, to }: HaversineInput): number => {
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

  return EARTH_RADIUS_MILES * c;
};
