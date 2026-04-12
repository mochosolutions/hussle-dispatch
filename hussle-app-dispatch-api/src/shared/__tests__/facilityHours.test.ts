import { ValidationError } from '../errors';
import {
  validateFacilityHoursJson,
  isFacilityOpenAt,
  getNextOpenWindow,
} from '../utils/facilityHours';
import type { FacilityDayHours } from '../utils/facilityHours';

const makeDayEntry = (overrides: Partial<FacilityDayHours> = {}): FacilityDayHours => ({
  dayOfWeek: 0,
  openTime: '08:00',
  closeTime: '17:00',
  isClosed: false,
  is24Hours: false,
  ...overrides,
});

const makeFullWeek = (
  defaults: Partial<FacilityDayHours> = {},
): FacilityDayHours[] =>
  Array.from({ length: 7 }, (_, i) => makeDayEntry({ dayOfWeek: i, ...defaults }));

describe('validateFacilityHoursJson', () => {
  it('returns parsed entries when input is valid', () => {
    const input = makeFullWeek();

    const result = validateFacilityHoursJson(input);

    expect(result).toHaveLength(7);
    result.forEach((entry, i) => {
      expect(entry.dayOfWeek).toBe(i);
    });
  });

  it('throws ValidationError when value is not an array', () => {
    expect(() => validateFacilityHoursJson('not-array')).toThrow(ValidationError);
    expect(() => validateFacilityHoursJson('not-array')).toThrow('must be an array');
  });

  it('throws ValidationError when value is null', () => {
    expect(() => validateFacilityHoursJson(null)).toThrow(ValidationError);
  });

  it('throws ValidationError when array length is not 7', () => {
    const tooFew = makeFullWeek().slice(0, 5);

    expect(() => validateFacilityHoursJson(tooFew)).toThrow(ValidationError);
    expect(() => validateFacilityHoursJson(tooFew)).toThrow('exactly 7');
  });

  it('throws ValidationError when entry is not an object', () => {
    const input = makeFullWeek();
    input[2] = 'bad' as unknown as FacilityDayHours;

    expect(() => validateFacilityHoursJson(input)).toThrow(ValidationError);
    expect(() => validateFacilityHoursJson(input)).toThrow('must be an object');
  });

  it('throws ValidationError when dayOfWeek is missing', () => {
    const input = makeFullWeek();
    const broken = { ...input[0] } as Record<string, unknown>;
    delete broken.dayOfWeek;
    input[0] = broken as unknown as FacilityDayHours;

    expect(() => validateFacilityHoursJson(input)).toThrow(ValidationError);
    expect(() => validateFacilityHoursJson(input)).toThrow('dayOfWeek');
  });

  it('throws ValidationError when dayOfWeek is out of range', () => {
    const input = makeFullWeek();
    input[0] = makeDayEntry({ dayOfWeek: 7 });

    expect(() => validateFacilityHoursJson(input)).toThrow(ValidationError);
    expect(() => validateFacilityHoursJson(input)).toThrow('dayOfWeek');
  });

  it('throws ValidationError when dayOfWeek is not an integer', () => {
    const input = makeFullWeek();
    input[0] = makeDayEntry({ dayOfWeek: 1.5 });

    expect(() => validateFacilityHoursJson(input)).toThrow(ValidationError);
  });

  it('throws ValidationError when openTime has invalid format', () => {
    const input = makeFullWeek();
    input[0] = makeDayEntry({ dayOfWeek: 0, openTime: '8:00' });

    expect(() => validateFacilityHoursJson(input)).toThrow(ValidationError);
    expect(() => validateFacilityHoursJson(input)).toThrow('openTime');
  });

  it('throws ValidationError when closeTime has invalid hours', () => {
    const input = makeFullWeek();
    input[0] = makeDayEntry({ dayOfWeek: 0, closeTime: '25:00' });

    expect(() => validateFacilityHoursJson(input)).toThrow(ValidationError);
    expect(() => validateFacilityHoursJson(input)).toThrow('closeTime');
  });

  it('throws ValidationError when isClosed is not a boolean', () => {
    const input = makeFullWeek();
    input[0] = { ...makeDayEntry({ dayOfWeek: 0 }), isClosed: 'yes' } as unknown as FacilityDayHours;

    expect(() => validateFacilityHoursJson(input)).toThrow(ValidationError);
    expect(() => validateFacilityHoursJson(input)).toThrow('isClosed');
  });

  it('throws ValidationError when is24Hours is not a boolean', () => {
    const input = makeFullWeek();
    input[0] = { ...makeDayEntry({ dayOfWeek: 0 }), is24Hours: 1 } as unknown as FacilityDayHours;

    expect(() => validateFacilityHoursJson(input)).toThrow(ValidationError);
    expect(() => validateFacilityHoursJson(input)).toThrow('is24Hours');
  });

  it('throws ValidationError when days are duplicated', () => {
    const input = makeFullWeek();
    // Make two entries with the same dayOfWeek
    input[6] = makeDayEntry({ dayOfWeek: 0 });

    expect(() => validateFacilityHoursJson(input)).toThrow(ValidationError);
    expect(() => validateFacilityHoursJson(input)).toThrow('Duplicate dayOfWeek');
  });

  it('throws ValidationError when not all days 0-6 are present', () => {
    // 7 entries but missing day 6, duplicate day 0
    const input = makeFullWeek();
    input[6] = makeDayEntry({ dayOfWeek: 0 });

    expect(() => validateFacilityHoursJson(input)).toThrow(ValidationError);
  });
});

describe('isFacilityOpenAt', () => {
  const timezone = 'America/Chicago'; // UTC-5 in winter, UTC-6 in summer

  it('returns true when facilityIs24Hours flag is true', () => {
    // All days closed in schedule, but facility-level flag overrides
    const hours = makeFullWeek({ isClosed: true });

    const result = isFacilityOpenAt({ hours, facilityIs24Hours: true, timezone, atUtc: new Date('2026-03-31T14:00:00Z') });

    expect(result).toBe(true);
  });

  it('returns true when current time is within open window', () => {
    // 2026-03-31 is a Tuesday (dayOfWeek=2)
    // 14:00 UTC = 09:00 CDT (Central Daylight, UTC-5 in March)
    const hours = makeFullWeek({ openTime: '08:00', closeTime: '17:00' });
    const atUtc = new Date('2026-03-31T14:00:00Z');

    const result = isFacilityOpenAt({ hours, facilityIs24Hours: false, timezone, atUtc });

    expect(result).toBe(true);
  });

  it('returns false when current time is before open window', () => {
    // 11:00 UTC = 06:00 CDT — before 08:00 open
    const hours = makeFullWeek({ openTime: '08:00', closeTime: '17:00' });
    const atUtc = new Date('2026-03-31T11:00:00Z');

    const result = isFacilityOpenAt({ hours, facilityIs24Hours: false, timezone, atUtc });

    expect(result).toBe(false);
  });

  it('returns false when current time is at or after close time', () => {
    // 22:00 UTC = 17:00 CDT — exactly at close time (close is exclusive)
    const hours = makeFullWeek({ openTime: '08:00', closeTime: '17:00' });
    const atUtc = new Date('2026-03-31T22:00:00Z');

    const result = isFacilityOpenAt({ hours, facilityIs24Hours: false, timezone, atUtc });

    expect(result).toBe(false);
  });

  it('returns false when the day is marked as closed', () => {
    const hours = makeFullWeek({ openTime: '08:00', closeTime: '17:00' });
    // Mark Tuesday (day 2) as closed
    const tuesdayIdx = hours.findIndex((h) => h.dayOfWeek === 2);
    hours[tuesdayIdx] = makeDayEntry({ dayOfWeek: 2, isClosed: true });

    const atUtc = new Date('2026-03-31T14:00:00Z'); // Tuesday

    const result = isFacilityOpenAt({ hours, facilityIs24Hours: false, timezone, atUtc });

    expect(result).toBe(false);
  });

  it('returns true when day entry has is24Hours set', () => {
    const hours = makeFullWeek({ isClosed: true });
    // Tuesday is 24h
    const tuesdayIdx = hours.findIndex((h) => h.dayOfWeek === 2);
    hours[tuesdayIdx] = makeDayEntry({ dayOfWeek: 2, is24Hours: true, isClosed: false });

    // 04:00 UTC on March 31 = 23:00 CDT March 30 (Monday). Pick a clear Tuesday time.
    const clearUtc = new Date('2026-03-31T14:00:00Z'); // Tuesday 09:00 CDT

    const result = isFacilityOpenAt({ hours, facilityIs24Hours: false, timezone, atUtc: clearUtc });

    expect(result).toBe(true);
  });

  it('handles timezone conversion correctly for US/Eastern', () => {
    // 2026-03-31 12:00 UTC = 08:00 EDT (UTC-4)
    const hours = makeFullWeek({ openTime: '08:00', closeTime: '17:00' });
    const atUtc = new Date('2026-03-31T12:00:00Z');

    const result = isFacilityOpenAt({ hours, facilityIs24Hours: false, timezone: 'America/New_York', atUtc });

    expect(result).toBe(true);
  });

  it('handles timezone conversion correctly for US/Pacific', () => {
    // 2026-03-31 12:00 UTC = 05:00 PDT (UTC-7) — before 08:00 open
    const hours = makeFullWeek({ openTime: '08:00', closeTime: '17:00' });
    const atUtc = new Date('2026-03-31T12:00:00Z');

    const result = isFacilityOpenAt({ hours, facilityIs24Hours: false, timezone: 'America/Los_Angeles', atUtc });

    expect(result).toBe(false);
  });
});

describe('getNextOpenWindow', () => {
  const timezone = 'America/Chicago';

  it('returns current window when facility is currently open', () => {
    // Tuesday 2026-03-31 14:00 UTC = 09:00 CDT, open 08:00-17:00
    const hours = makeFullWeek({ openTime: '08:00', closeTime: '17:00' });
    const fromUtc = new Date('2026-03-31T14:00:00Z');

    const result = getNextOpenWindow(hours, timezone, fromUtc);

    expect(result).not.toBeNull();
    // openUtc should be fromUtc since we're already in the window
    expect(result?.openUtc.getTime()).toBe(fromUtc.getTime());
    // closeUtc should be 17:00 CDT = 22:00 UTC
    expect(result?.closeUtc.getTime()).toBe(new Date('2026-03-31T22:00:00Z').getTime());
  });

  it('returns today window when before open time', () => {
    // Tuesday 2026-03-31 11:00 UTC = 06:00 CDT, before 08:00 open
    const hours = makeFullWeek({ openTime: '08:00', closeTime: '17:00' });
    const fromUtc = new Date('2026-03-31T11:00:00Z');

    const result = getNextOpenWindow(hours, timezone, fromUtc);

    expect(result).not.toBeNull();
    // openUtc should be 08:00 CDT = 13:00 UTC
    expect(result?.openUtc.getTime()).toBe(new Date('2026-03-31T13:00:00Z').getTime());
    // closeUtc should be 17:00 CDT = 22:00 UTC
    expect(result?.closeUtc.getTime()).toBe(new Date('2026-03-31T22:00:00Z').getTime());
  });

  it('returns next day window when past close time today', () => {
    // Tuesday 2026-03-31 23:00 UTC = 18:00 CDT, past 17:00 close
    const hours = makeFullWeek({ openTime: '08:00', closeTime: '17:00' });
    const fromUtc = new Date('2026-03-31T23:00:00Z');

    const result = getNextOpenWindow(hours, timezone, fromUtc);

    expect(result).not.toBeNull();
    // Next window should be Wednesday 08:00 CDT = 2026-04-01 13:00 UTC
    expect(result?.openUtc.getTime()).toBe(new Date('2026-04-01T13:00:00Z').getTime());
  });

  it('skips closed days to find the next open window', () => {
    const hours = makeFullWeek({ openTime: '08:00', closeTime: '17:00' });
    // Close Wednesday (3) and Thursday (4)
    const wedIdx = hours.findIndex((h) => h.dayOfWeek === 3);
    const thuIdx = hours.findIndex((h) => h.dayOfWeek === 4);
    hours[wedIdx] = makeDayEntry({ dayOfWeek: 3, isClosed: true });
    hours[thuIdx] = makeDayEntry({ dayOfWeek: 4, isClosed: true });

    // Tuesday 23:00 UTC = 18:00 CDT, past close
    const fromUtc = new Date('2026-03-31T23:00:00Z');

    const result = getNextOpenWindow(hours, timezone, fromUtc);

    expect(result).not.toBeNull();
    // Should skip Wed and Thu, land on Friday 08:00 CDT = 2026-04-03 13:00 UTC
    expect(result?.openUtc.getTime()).toBe(new Date('2026-04-03T13:00:00Z').getTime());
  });

  it('returns null when all days are closed', () => {
    const hours = makeFullWeek({ isClosed: true });
    const fromUtc = new Date('2026-03-31T14:00:00Z');

    const result = getNextOpenWindow(hours, timezone, fromUtc);

    expect(result).toBeNull();
  });

  it('handles 24-hour day entries', () => {
    const hours = makeFullWeek({ isClosed: true });
    // Only Wednesday (3) is open, 24 hours
    const wedIdx = hours.findIndex((h) => h.dayOfWeek === 3);
    hours[wedIdx] = makeDayEntry({ dayOfWeek: 3, is24Hours: true, isClosed: false });

    // Tuesday 23:00 UTC = 18:00 CDT, past any close
    const fromUtc = new Date('2026-03-31T23:00:00Z');

    const result = getNextOpenWindow(hours, timezone, fromUtc);

    expect(result).not.toBeNull();
    // Wednesday 00:00 CDT
    expect(result?.openUtc).toBeDefined();
    expect(result?.closeUtc).toBeDefined();
    // The close should be ~24 hours after open
    expect(result).not.toBeNull();
    if (result !== null) {
      const windowHours =
        (result.closeUtc.getTime() - result.openUtc.getTime()) / (1000 * 60 * 60);
      expect(windowHours).toBe(24);
    }
  });
});
