import { calculateStateMiles, loadStateBoundaries } from '../stateBoundaryLookup';

describe('loadStateBoundaries', () => {
  it('returns a FeatureCollection', () => {
    const result = loadStateBoundaries();

    expect(result.type).toBe('FeatureCollection');
    expect(Array.isArray(result.features)).toBe(true);
  });

  it('caches the result on subsequent calls', () => {
    const first = loadStateBoundaries();
    const second = loadStateBoundaries();

    expect(first).toBe(second);
  });
});

describe('calculateStateMiles', () => {
  it('returns empty array when routeGeometry is empty', () => {
    const result = calculateStateMiles([]);

    expect(result).toEqual([]);
  });

  it('returns empty array when routeGeometry has fewer than 2 points', () => {
    const result = calculateStateMiles([[0, 0]]);

    expect(result).toEqual([]);
  });

  it('returns state miles for a route crossing multiple states', () => {
    // Washington DC to New York City — crosses DC/MD/DE/NJ/NY
    const result = calculateStateMiles([
      [-77.0364, 38.8951],
      [-74.006, 40.7128],
    ]);

    expect(result.length).toBeGreaterThan(0);
    result.forEach((entry) => {
      expect(entry.state).toMatch(/^[A-Z]{2}$/);
      expect(entry.miles).toBeGreaterThan(0);
    });
    // Results should be sorted descending by miles
    for (let i = 1; i < result.length; i += 1) {
      const prev = result[i - 1];
      const curr = result[i];
      if (prev && curr) {
        expect(prev.miles).toBeGreaterThanOrEqual(curr.miles);
      }
    }
  });

  it('returns single state for route entirely within one state', () => {
    // Two points within Texas
    const result = calculateStateMiles([
      [-97.7431, 30.2672], // Austin
      [-96.797, 32.7767],  // Dallas
    ]);

    expect(result.length).toBeGreaterThanOrEqual(1);
    const first = result[0];
    expect(first).toBeDefined();
    expect(first?.state).toBe('TX');
    expect(first?.miles).toBeGreaterThan(0);
  });
});
