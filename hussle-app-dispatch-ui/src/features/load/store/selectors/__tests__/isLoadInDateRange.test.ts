import { isLoadInDateRange } from '../loadSelectors';
import type { LoadListItem } from '../../../types';

// Minimal load shape — isLoadInDateRange only reads route.stops appointment dates.
const buildLoad = (pickup: string | null, delivery: string | null): LoadListItem => {
  const stops = [];
  if (pickup !== null) {
    stops.push({ type: 'PICKUP', sequence: 1, appointmentStart: pickup });
  }
  if (delivery !== null) {
    stops.push({ type: 'DELIVERY', sequence: 2, appointmentStart: delivery });
  }
  return { route: { stops } } as unknown as LoadListItem;
};

// Window: Mon 2026-05-25 .. Sun 2026-05-31 (inclusive, full-day aligned).
const FROM = '2026-05-25T00:00:00.000Z';
const TO = '2026-05-31T23:59:59.999Z';

describe('isLoadInDateRange', () => {
  it('returns true for all loads when no date bounds are set', () => {
    expect(isLoadInDateRange(buildLoad('2020-01-01T00:00:00Z', null))).toBe(true);
  });

  it('matches when the pickup falls in the window', () => {
    const load = buildLoad('2026-05-27T15:00:00.000Z', '2026-06-10T15:00:00.000Z');
    expect(isLoadInDateRange(load, FROM, TO)).toBe(true);
  });

  it('matches when only the delivery falls in the window (pickup before)', () => {
    const load = buildLoad('2026-05-20T15:00:00.000Z', '2026-05-29T15:00:00.000Z');
    expect(isLoadInDateRange(load, FROM, TO)).toBe(true);
  });

  it('excludes a load whose pickup and delivery are both outside the window', () => {
    const load = buildLoad('2026-05-20T15:00:00.000Z', '2026-06-05T15:00:00.000Z');
    expect(isLoadInDateRange(load, FROM, TO)).toBe(false);
  });

  it('matches on the inclusive boundary day', () => {
    const load = buildLoad('2026-05-31T23:00:00.000Z', null);
    expect(isLoadInDateRange(load, FROM, TO)).toBe(true);
  });

  it('excludes a load with no pickup or delivery dates', () => {
    expect(isLoadInDateRange(buildLoad(null, null), FROM, TO)).toBe(false);
  });
});
