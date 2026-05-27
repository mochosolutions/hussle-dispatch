import type { LoadFormValues } from '../validators/loadSchema';

interface Coordinates {
  lat: number;
  lng: number;
}

export const STATE_COORDINATES: Record<string, Coordinates> = {
  AL: { lat: 32.36, lng: -86.3 },
  AR: { lat: 34.75, lng: -92.29 },
  AZ: { lat: 33.45, lng: -112.07 },
  CA: { lat: 36.78, lng: -119.42 },
  CO: { lat: 39.74, lng: -104.99 },
  CT: { lat: 41.76, lng: -72.68 },
  DE: { lat: 39.16, lng: -75.52 },
  FL: { lat: 28.54, lng: -81.38 },
  GA: { lat: 33.75, lng: -84.39 },
  IA: { lat: 41.59, lng: -93.62 },
  ID: { lat: 43.62, lng: -116.2 },
  IL: { lat: 39.8, lng: -89.65 },
  IN: { lat: 39.77, lng: -86.16 },
  KS: { lat: 39.05, lng: -95.68 },
  KY: { lat: 38.2, lng: -84.87 },
  LA: { lat: 30.46, lng: -91.19 },
  MA: { lat: 42.36, lng: -71.06 },
  MD: { lat: 39.29, lng: -76.61 },
  ME: { lat: 44.31, lng: -69.78 },
  MI: { lat: 42.73, lng: -84.56 },
  MN: { lat: 44.98, lng: -93.27 },
  MO: { lat: 38.63, lng: -90.2 },
  MS: { lat: 32.3, lng: -90.18 },
  MT: { lat: 46.59, lng: -112.04 },
  NC: { lat: 35.23, lng: -80.84 },
  ND: { lat: 46.81, lng: -100.78 },
  NE: { lat: 40.81, lng: -96.7 },
  NH: { lat: 43.21, lng: -71.54 },
  NJ: { lat: 40.73, lng: -74.17 },
  NM: { lat: 35.69, lng: -105.94 },
  NV: { lat: 39.16, lng: -119.77 },
  NY: { lat: 40.71, lng: -74.0 },
  OH: { lat: 39.96, lng: -83.0 },
  OK: { lat: 35.47, lng: -97.52 },
  OR: { lat: 44.94, lng: -123.03 },
  PA: { lat: 40.0, lng: -75.13 },
  RI: { lat: 41.82, lng: -71.41 },
  SC: { lat: 34.0, lng: -81.03 },
  SD: { lat: 44.37, lng: -100.35 },
  TN: { lat: 36.16, lng: -86.78 },
  TX: { lat: 30.27, lng: -97.74 },
  UT: { lat: 40.76, lng: -111.89 },
  VA: { lat: 37.54, lng: -77.44 },
  VT: { lat: 44.26, lng: -72.58 },
  WA: { lat: 47.04, lng: -122.9 },
  WI: { lat: 43.07, lng: -89.4 },
  WV: { lat: 38.35, lng: -81.63 },
  WY: { lat: 41.14, lng: -104.82 },
};

export const getCoordinates = (stateCode: string): Coordinates | null => {
  const normalized = stateCode.trim().toUpperCase();
  return STATE_COORDINATES[normalized] ?? null;
};

export const haversineMiles = (from: Coordinates, to: Coordinates): number => {
  const R = 3959;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const calculateLegMiles = (
  stateA: string,
  stateB: string,
): number | null => {
  const a = getCoordinates(stateA);
  const b = getCoordinates(stateB);
  if (!a || !b) {
    return null;
  }
  return Math.round(haversineMiles(a, b));
};

export const calculateTotalMiles = (stops: LoadFormValues['stops']): number => {
  const total = stops.reduce((acc, stop, index) => {
    if (index === 0) {
      return acc;
    }
    const prev = getCoordinates(stops[index - 1].state);
    const curr = getCoordinates(stop.state);
    if (!prev || !curr) {
      return acc;
    }
    return acc + haversineMiles(prev, curr);
  }, 0);
  return Math.round(total);
};

interface CoordStop {
  lat?: number | null;
  lng?: number | null;
  state?: string;
}

const hasCoords = (stop: CoordStop): stop is CoordStop & { lat: number; lng: number } =>
  stop.lat !== null && stop.lat !== undefined && stop.lng !== null && stop.lng !== undefined;

export const calculateLegMilesFromCoords = (
  stopA: CoordStop,
  stopB: CoordStop,
): number | null => {
  if (hasCoords(stopA) && hasCoords(stopB)) {
    return Math.round(
      haversineMiles({ lat: stopA.lat, lng: stopA.lng }, { lat: stopB.lat, lng: stopB.lng }),
    );
  }
  if (stopA.state && stopB.state) {
    return calculateLegMiles(stopA.state, stopB.state);
  }
  return null;
};

export const calculateTotalMilesFromCoords = (stops: CoordStop[]): number => {
  const total = stops.reduce((acc, stop, index) => {
    if (index === 0) {
      return acc;
    }
    const legMiles = calculateLegMilesFromCoords(stops[index - 1], stop);
    return acc + (legMiles ?? 0);
  }, 0);
  return total;
};
