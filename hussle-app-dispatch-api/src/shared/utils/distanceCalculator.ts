const EARTH_RADIUS_MILES = 3958.8;
const ROAD_FACTOR = 1.2;

interface Coordinates {
  lat: number;
  lng: number;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Calculates approximate road distance between two geographic coordinates.
 * Uses the Haversine formula for great-circle distance, then applies a 1.2x
 * road factor to approximate actual driving distance.
 *
 * Returns distance in miles.
 */
const calculateRoadDistance = (from: Coordinates, to: Coordinates): number => {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const greatCircleDistance = EARTH_RADIUS_MILES * c;

  return greatCircleDistance * ROAD_FACTOR;
};

export type { Coordinates };
export { calculateRoadDistance };
