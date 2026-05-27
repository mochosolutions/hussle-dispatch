/**
 * Normalizes driver lane and zone preferences from structured objects
 * to the "state:city" string format used by calculateDriverFit.
 *
 * The format matches loadIntelService.ts destination:
 *   `${payload.dest.state}:${payload.dest.city}`
 */

export interface LanePreference {
  originState: string;
  destState: string;
  originCity?: string;
  destCity?: string;
}

export interface ZonePreference {
  state: string;
  city?: string;
}

const isNonNullObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasStringProperty = (
  obj: Record<string, unknown>,
  key: string,
): obj is Record<string, unknown> & Record<typeof key, string> =>
  typeof obj[key] === 'string' && obj[key].length > 0;

const isLanePreference = (value: unknown): value is LanePreference =>
  isNonNullObject(value) && hasStringProperty(value, 'destState');

const isZonePreference = (value: unknown): value is ZonePreference =>
  isNonNullObject(value) && hasStringProperty(value, 'state');

/**
 * Converts structured lane preference objects to "destState:destCity" strings.
 * Handles already-string values (passthrough), null/undefined (skip),
 * empty arrays, and objects missing expected properties (skip).
 */
export const normalizeLanes = (preferredLanes: unknown[]): string[] =>
  preferredLanes.reduce<string[]>((acc, item) => {
    if (typeof item === 'string') {
      acc.push(item);
      return acc;
    }

    if (isLanePreference(item)) {
      const city = typeof item.destCity === 'string' ? item.destCity : '';
      acc.push(`${item.destState}:${city}`);
    }

    return acc;
  }, []);

/**
 * Converts structured zone preference objects to "state:city" strings.
 * Handles already-string values (passthrough), null/undefined (skip),
 * empty arrays, and objects missing expected properties (skip).
 */
export const normalizeZones = (noGoZones: unknown[]): string[] =>
  noGoZones.reduce<string[]>((acc, item) => {
    if (typeof item === 'string') {
      acc.push(item);
      return acc;
    }

    if (isZonePreference(item)) {
      const city = typeof item.city === 'string' ? item.city : '';
      acc.push(`${item.state}:${city}`);
    }

    return acc;
  }, []);
