import { resolveStopTimezone } from '../services/resolveStopTimezone';

describe('resolveStopTimezone', () => {
  it('returns the primary IANA TZ for a known state (Texas -> America/Chicago)', () => {
    expect(resolveStopTimezone('Houston', 'TX')).toBe('America/Chicago');
  });

  it('returns Eastern for a Tennessee city in the Eastern band (Knoxville)', () => {
    expect(resolveStopTimezone('Knoxville', 'TN')).toBe('America/New_York');
  });

  it('returns Central for a Tennessee city outside the Eastern band (Memphis)', () => {
    expect(resolveStopTimezone('Memphis', 'TN')).toBe('America/Chicago');
  });

  it('returns null for an unknown state', () => {
    expect(resolveStopTimezone('Toronto', 'ZZ')).toBeNull();
  });

  it('returns null when state is null', () => {
    expect(resolveStopTimezone('Anywhere', null)).toBeNull();
  });

  it('returns null when both inputs are null', () => {
    expect(resolveStopTimezone(null, null)).toBeNull();
  });

  it('returns the state default when city is null but state is known', () => {
    expect(resolveStopTimezone(null, 'CA')).toBe('America/Los_Angeles');
  });
});
