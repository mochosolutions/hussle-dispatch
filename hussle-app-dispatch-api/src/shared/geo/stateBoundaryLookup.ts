import fs from 'node:fs';
import path from 'node:path';
import type { FeatureCollection, Feature, MultiPolygon, Polygon } from 'geojson';
import { lineString, point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import lineSplit from '@turf/line-split';
import length from '@turf/length';
import type { StateMileEntry } from '../routing/types';

const STATE_NAME_TO_ABBREV: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO',
  Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY', 'District of Columbia': 'DC', 'Puerto Rico': 'PR',
};

const getStateCode = (properties: Record<string, unknown> | null): string | undefined => {
  if (!properties) {
    return undefined;
  }
  // Support both STUSPS (TIGER/Line) and name (PublicaMundi) formats
  const stusps = properties['STUSPS'];
  if (typeof stusps === 'string') {
    return stusps;
  }
  const name = properties['name'];
  if (typeof name === 'string') {
    return STATE_NAME_TO_ABBREV[name];
  }
  return undefined;
};

let cachedBoundaries: FeatureCollection | null = null;

export const loadStateBoundaries = (): FeatureCollection => {
  if (cachedBoundaries) {
    return cachedBoundaries;
  }

  const filePath = path.join(__dirname, 'us-states.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  cachedBoundaries = JSON.parse(raw) as FeatureCollection;
  return cachedBoundaries;
};

/**
 * Calculates miles driven through each US state given a route geometry.
 * Coordinates are [longitude, latitude] pairs (GeoJSON convention).
 *
 * Returns entries sorted descending by miles. Zero-mile entries are excluded.
 * Gracefully returns [] when no state boundaries are loaded (placeholder GeoJSON).
 */
export const calculateStateMiles = (routeGeometry: [number, number][]): StateMileEntry[] => {
  if (routeGeometry.length < 2) {
    return [];
  }

  const boundaries = loadStateBoundaries();

  if (boundaries.features.length === 0) {
    return [];
  }

  const line = lineString(routeGeometry);
  const totalMiles = length(line, { units: 'miles' });

  if (totalMiles === 0) {
    return [];
  }

  const stateFeatures = boundaries.features.filter(
    (f): f is Feature<Polygon | MultiPolygon> =>
      f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon',
  );

  const entries: StateMileEntry[] = [];

  stateFeatures.forEach((stateFeature) => {
    const stateCode = getStateCode(stateFeature.properties as Record<string, unknown> | null);
    if (!stateCode) {
      return;
    }

    const splitResult = lineSplit(line, stateFeature);
    let stateMiles = 0;

    splitResult.features.forEach((segment) => {
      const coords = segment.geometry.coordinates;
      if (coords.length === 0) {
        return;
      }

      // Check if the midpoint of this segment is inside the state polygon
      const midIdx = Math.floor(coords.length / 2);
      const midCoord = coords[midIdx];
      if (!midCoord) {
        return;
      }

      const midPoint = point(midCoord);
      if (booleanPointInPolygon(midPoint, stateFeature)) {
        stateMiles += length(segment, { units: 'miles' });
      }
    });

    // If line was not split (entirely inside or outside), check if the start is inside
    if (splitResult.features.length === 0) {
      const startCoord = routeGeometry[0];
      if (startCoord) {
        const startPoint = point(startCoord);
        if (booleanPointInPolygon(startPoint, stateFeature)) {
          stateMiles = totalMiles;
        }
      }
    }

    if (stateMiles > 0) {
      entries.push({ state: stateCode, miles: Math.round(stateMiles * 100) / 100 });
    }
  });

  entries.sort((a, b) => b.miles - a.miles);
  return entries;
};
