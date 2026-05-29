import { computeCameraTarget } from '../computeCameraTarget';

describe('computeCameraTarget', () => {
  it('returns noop when there are no stops and no driver', () => {
    expect(computeCameraTarget([], null)).toEqual({ kind: 'noop' });
  });

  it('returns a jumpTo (no animation) for a single point', () => {
    const result = computeCameraTarget([{ lat: 36.16, lng: -86.78 }], null);

    expect(result).toEqual({
      kind: 'jump',
      center: [-86.78, 36.16],
      zoom: 8,
    });
  });

  it('returns a fit target for multiple points (pickup + delivery)', () => {
    const stops = [
      { lat: 36.16, lng: -86.78 },
      { lat: 40.71, lng: -74.0 },
    ];

    const result = computeCameraTarget(stops, null);

    expect(result.kind).toBe('fit');
    if (result.kind === 'fit') {
      expect(result.points).toEqual([
        [-86.78, 36.16],
        [-74.0, 40.71],
      ]);
    }
  });

  it('includes the driver pin in the fit bounds when present', () => {
    const stops = [
      { lat: 36.16, lng: -86.78 },
      { lat: 40.71, lng: -74.0 },
    ];

    const result = computeCameraTarget(stops, { lat: 38.5, lng: -80.0 });

    if (result.kind !== 'fit') {
      throw new Error(`Expected fit target, got ${result.kind}`);
    }
    expect(result.points).toHaveLength(3);
    expect(result.points).toContainEqual([-80.0, 38.5]);
  });

  it('still returns jumpTo when only the driver pin is known', () => {
    const result = computeCameraTarget([], { lat: 36.16, lng: -86.78 });

    expect(result).toEqual({
      kind: 'jump',
      center: [-86.78, 36.16],
      zoom: 8,
    });
  });
});
