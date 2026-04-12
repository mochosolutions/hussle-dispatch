import { resolveDriverAvailability } from '../utils/driverAvailability';

describe('resolveDriverAvailability', () => {
  // 2026-03-31 is a Tuesday
  const tuesdayUtc = new Date('2026-03-31T14:00:00Z');

  const weeklySchedule = [
    { dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '17:00', is24Hours: false },
    { dayOfWeek: 'WEDNESDAY', startTime: '06:00', endTime: '18:00', is24Hours: false },
    { dayOfWeek: 'SATURDAY', startTime: '00:00', endTime: '23:59', is24Hours: true },
  ];

  describe('overrides', () => {
    it('returns unavailable when override type is OFF', () => {
      // Arrange
      const overrides = [
        { date: new Date('2026-03-31'), type: 'OFF' },
      ];

      // Act
      const result = resolveDriverAvailability({
        weeklySchedule,
        overrides,
        timezone: 'America/Chicago',
        atUtc: tuesdayUtc,
      });

      // Assert
      expect(result.available).toBe(false);
      expect(result.windowStart).toBeNull();
      expect(result.windowEnd).toBeNull();
      expect(result.source).toBe('override');
    });

    it('returns available with override times when type is MODIFIED', () => {
      // Arrange
      const overrides = [
        { date: new Date('2026-03-31'), type: 'MODIFIED', startTime: '10:00', endTime: '14:00' },
      ];

      // Act
      const result = resolveDriverAvailability({
        weeklySchedule,
        overrides,
        timezone: 'America/Chicago',
        atUtc: tuesdayUtc,
      });

      // Assert
      expect(result.available).toBe(true);
      expect(result.windowStart).toBe('10:00');
      expect(result.windowEnd).toBe('14:00');
      expect(result.source).toBe('override');
    });

    it('returns available with override times when type is ADDED', () => {
      // Arrange — Sunday has no weekly entry but has an ADDED override
      const sundayUtc = new Date('2026-03-29T16:00:00Z');
      const overrides = [
        { date: new Date('2026-03-29'), type: 'ADDED', startTime: '09:00', endTime: '13:00' },
      ];

      // Act
      const result = resolveDriverAvailability({
        weeklySchedule,
        overrides,
        timezone: 'America/Chicago',
        atUtc: sundayUtc,
      });

      // Assert
      expect(result.available).toBe(true);
      expect(result.windowStart).toBe('09:00');
      expect(result.windowEnd).toBe('13:00');
      expect(result.source).toBe('override');
    });

    it('takes priority over weekly schedule', () => {
      // Arrange — Tuesday has a weekly entry 08:00-17:00 but override says OFF
      const overrides = [
        { date: new Date('2026-03-31'), type: 'OFF' },
      ];

      // Act
      const result = resolveDriverAvailability({
        weeklySchedule,
        overrides,
        timezone: 'America/Chicago',
        atUtc: tuesdayUtc,
      });

      // Assert
      expect(result.source).toBe('override');
      expect(result.available).toBe(false);
    });
  });

  describe('weekly schedule', () => {
    it('returns available all day when is24Hours is true', () => {
      // Arrange — Saturday 2026-04-04 is24Hours
      const saturdayUtc = new Date('2026-04-04T10:00:00Z');

      // Act
      const result = resolveDriverAvailability({
        weeklySchedule,
        overrides: [],
        timezone: 'America/Chicago',
        atUtc: saturdayUtc,
      });

      // Assert
      expect(result.available).toBe(true);
      expect(result.windowStart).toBe('00:00');
      expect(result.windowEnd).toBe('23:59');
      expect(result.source).toBe('weekly');
    });

    it('returns available when current time is within window', () => {
      // Arrange — 14:00 UTC = 09:00 CDT, within 08:00-17:00
      const withinWindowUtc = new Date('2026-03-31T14:00:00Z');

      // Act
      const result = resolveDriverAvailability({
        weeklySchedule,
        overrides: [],
        timezone: 'America/Chicago',
        atUtc: withinWindowUtc,
      });

      // Assert
      expect(result.available).toBe(true);
      expect(result.windowStart).toBe('08:00');
      expect(result.windowEnd).toBe('17:00');
      expect(result.source).toBe('weekly');
    });

    it('returns unavailable when current time is outside window', () => {
      // Arrange — 04:00 UTC = 23:00 CDT (prev day Monday), but let's use early morning
      // 11:00 UTC = 06:00 CDT, before 08:00 start
      const earlyMorningUtc = new Date('2026-03-31T11:00:00Z');

      // Act
      const result = resolveDriverAvailability({
        weeklySchedule,
        overrides: [],
        timezone: 'America/Chicago',
        atUtc: earlyMorningUtc,
      });

      // Assert
      expect(result.available).toBe(false);
      expect(result.windowStart).toBe('08:00');
      expect(result.windowEnd).toBe('17:00');
      expect(result.source).toBe('weekly');
    });

    it('returns available at exact start time boundary', () => {
      // Arrange — 13:00 UTC = 08:00 CDT, exactly at start
      const atStartUtc = new Date('2026-03-31T13:00:00Z');

      // Act
      const result = resolveDriverAvailability({
        weeklySchedule,
        overrides: [],
        timezone: 'America/Chicago',
        atUtc: atStartUtc,
      });

      // Assert
      expect(result.available).toBe(true);
      expect(result.source).toBe('weekly');
    });

    it('returns available at exact end time boundary', () => {
      // Arrange — 22:00 UTC = 17:00 CDT, exactly at end
      const atEndUtc = new Date('2026-03-31T22:00:00Z');

      // Act
      const result = resolveDriverAvailability({
        weeklySchedule,
        overrides: [],
        timezone: 'America/Chicago',
        atUtc: atEndUtc,
      });

      // Assert
      expect(result.available).toBe(true);
      expect(result.source).toBe('weekly');
    });
  });

  describe('no schedule entry', () => {
    it('returns unavailable with source none when no weekly entry exists', () => {
      // Arrange — Monday has no entry in weeklySchedule
      const mondayUtc = new Date('2026-03-30T14:00:00Z');

      // Act
      const result = resolveDriverAvailability({
        weeklySchedule,
        overrides: [],
        timezone: 'America/Chicago',
        atUtc: mondayUtc,
      });

      // Assert
      expect(result.available).toBe(false);
      expect(result.windowStart).toBeNull();
      expect(result.windowEnd).toBeNull();
      expect(result.source).toBe('none');
    });
  });

  describe('timezone handling', () => {
    it('resolves day-of-week based on driver local time, not UTC', () => {
      // Arrange — 2026-04-01 03:00 UTC = 2026-03-31 22:00 CDT (still Tuesday locally)
      const lateUtcWednesday = new Date('2026-04-01T03:00:00Z');

      // Act
      const result = resolveDriverAvailability({
        weeklySchedule,
        overrides: [],
        timezone: 'America/Chicago',
        atUtc: lateUtcWednesday,
      });

      // Assert — should match Tuesday (local), not Wednesday (UTC)
      expect(result.source).toBe('weekly');
      expect(result.windowStart).toBe('08:00');
      expect(result.windowEnd).toBe('17:00');
    });
  });
});
