import {
  computeCommoditySummary,
} from '../../shared/utils/computeCommoditySummary';
import type { CommoditySummaryStop } from '../../shared/utils/computeCommoditySummary';

const makeStop = (overrides: Partial<CommoditySummaryStop> = {}): CommoditySummaryStop => ({
  type: 'PICKUP',
  ...overrides,
});

describe('computeCommoditySummary', () => {
  it('returns empty summary when no pickup stops exist', () => {
    const stops: CommoditySummaryStop[] = [
      makeStop({ type: 'DELIVERY', commodity: 'Electronics', weight: 5000 }),
    ];

    const result = computeCommoditySummary(stops);

    expect(result.commodity).toBeUndefined();
    expect(result.weight).toBeUndefined();
    expect(result.pieceCount).toBeUndefined();
    expect(result.isHazmat).toBe(false);
    expect(result.isTarp).toBe(false);
  });

  it('returns commodity from a single pickup stop', () => {
    const stops: CommoditySummaryStop[] = [
      makeStop({ commodity: 'Dry goods', weight: 10000, pieceCount: 20 }),
      makeStop({ type: 'DELIVERY' }),
    ];

    const result = computeCommoditySummary(stops);

    expect(result.commodity).toBe('Dry goods');
    expect(result.weight).toBe(10000);
    expect(result.pieceCount).toBe(20);
  });

  it('joins distinct commodities from multiple pickup stops', () => {
    const stops: CommoditySummaryStop[] = [
      makeStop({ commodity: 'Electronics', weight: 5000, pieceCount: 10 }),
      makeStop({ commodity: 'Furniture', weight: 8000, pieceCount: 5 }),
      makeStop({ type: 'DELIVERY' }),
    ];

    const result = computeCommoditySummary(stops);

    expect(result.commodity).toBe('Electronics, Furniture');
    expect(result.weight).toBe(13000);
    expect(result.pieceCount).toBe(15);
  });

  it('deduplicates identical commodity names', () => {
    const stops: CommoditySummaryStop[] = [
      makeStop({ commodity: 'Palletized freight', weight: 6000 }),
      makeStop({ commodity: 'Palletized freight', weight: 4000 }),
      makeStop({ type: 'DELIVERY' }),
    ];

    const result = computeCommoditySummary(stops);

    expect(result.commodity).toBe('Palletized freight');
    expect(result.weight).toBe(10000);
  });

  it('aggregates isHazmat from any stop (not just pickups)', () => {
    const stops: CommoditySummaryStop[] = [
      makeStop({ commodity: 'Chemicals', isHazmat: true }),
      makeStop({ commodity: 'Paper' }),
      makeStop({ type: 'DELIVERY' }),
    ];

    const result = computeCommoditySummary(stops);

    expect(result.isHazmat).toBe(true);
    expect(result.isTarp).toBe(false);
  });

  it('aggregates isTarp from any stop', () => {
    const stops: CommoditySummaryStop[] = [
      makeStop({ commodity: 'Lumber', isTarp: true }),
      makeStop({ type: 'DELIVERY', isTarp: false }),
    ];

    const result = computeCommoditySummary(stops);

    expect(result.isTarp).toBe(true);
  });

  it('returns undefined weight when no pickup has weight', () => {
    const stops: CommoditySummaryStop[] = [
      makeStop({ commodity: 'General freight' }),
      makeStop({ type: 'DELIVERY' }),
    ];

    const result = computeCommoditySummary(stops);

    expect(result.weight).toBeUndefined();
    expect(result.pieceCount).toBeUndefined();
  });

  it('returns undefined commodity when no pickup has commodity set', () => {
    const stops: CommoditySummaryStop[] = [
      makeStop({ weight: 10000 }),
      makeStop({ type: 'DELIVERY' }),
    ];

    const result = computeCommoditySummary(stops);

    expect(result.commodity).toBeUndefined();
    expect(result.weight).toBe(10000);
  });

  it('handles empty stops array', () => {
    const result = computeCommoditySummary([]);

    expect(result.commodity).toBeUndefined();
    expect(result.weight).toBeUndefined();
    expect(result.pieceCount).toBeUndefined();
    expect(result.isHazmat).toBe(false);
    expect(result.isTarp).toBe(false);
  });

  it('detects hazmat from delivery stop too', () => {
    const stops: CommoditySummaryStop[] = [
      makeStop({ commodity: 'Safe goods' }),
      makeStop({ type: 'DELIVERY', isHazmat: true }),
    ];

    const result = computeCommoditySummary(stops);

    expect(result.isHazmat).toBe(true);
  });
});
