import { STALE_TTL_MS, isStale } from './staleness';

describe('isStale', () => {
  const FIXED_NOW = 1_700_000_000_000;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when lastFetchedAt is null', () => {
    expect(isStale(null)).toBe(true);
  });

  it('returns false for a recent timestamp within the default TTL', () => {
    const recent = FIXED_NOW - 1000;

    expect(isStale(recent)).toBe(false);
  });

  it('returns true when the timestamp is older than the default TTL', () => {
    const old = FIXED_NOW - (STALE_TTL_MS + 1);

    expect(isStale(old)).toBe(true);
  });

  it('honors a custom TTL', () => {
    const ts = FIXED_NOW - 5_000;

    expect(isStale(ts, 10_000)).toBe(false);
    expect(isStale(ts, 1_000)).toBe(true);
  });

  it('exposes a 60_000 ms default TTL constant', () => {
    expect(STALE_TTL_MS).toBe(60_000);
  });
});
