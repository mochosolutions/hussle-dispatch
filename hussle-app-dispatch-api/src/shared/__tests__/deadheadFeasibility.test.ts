import { calculateDeadheadFeasibility } from '../utils/deadheadFeasibility';
import type { DeadheadInput } from '../utils/deadheadFeasibility';

describe('calculateDeadheadFeasibility', () => {
  // Dallas, TX → Houston, TX (~225 straight-line miles)
  const dallas = { lat: 32.7767, lng: -96.797 };
  const houston = { lat: 29.7604, lng: -95.3698 };

  const makeInput = (overrides: Partial<DeadheadInput> = {}): DeadheadInput => ({
    driverCoords: dallas,
    pickupCoords: houston,
    targetArrivalUtc: new Date('2026-04-01T18:00:00Z'),
    nowUtc: new Date('2026-04-01T08:00:00Z'),
    ...overrides,
  });

  it('returns GREEN when driver has plenty of time', () => {
    // Arrange — 10 hours to cover ~225 miles (about 4-5 hours drive)
    const input = makeInput();

    // Act
    const result = calculateDeadheadFeasibility(input);

    // Assert
    expect(result.status).toBe('GREEN');
    expect(result.deadheadMiles).toBeGreaterThan(0);
    expect(result.estimatedDriveMinutes).toBeGreaterThan(0);
    expect(result.bufferMinutes).toBeGreaterThanOrEqual(60);
    expect(result.estimatedArrivalUtc.getTime()).toBeLessThan(
      input.targetArrivalUtc.getTime(),
    );
  });

  it('returns YELLOW when driver can make it but buffer is under 60 minutes', () => {
    // Arrange — Dallas to Houston is ~225 mi straight, ~293 road, ~319 min drive
    // Set target so buffer is between 0 and 60
    const nowUtc = new Date('2026-04-01T08:00:00Z');
    const result0 = calculateDeadheadFeasibility(makeInput({ nowUtc }));
    const tightTarget = new Date(
      result0.estimatedArrivalUtc.getTime() + 30 * 60_000,
    );
    const input = makeInput({ nowUtc, targetArrivalUtc: tightTarget });

    // Act
    const result = calculateDeadheadFeasibility(input);

    // Assert
    expect(result.status).toBe('YELLOW');
    expect(result.bufferMinutes).toBeGreaterThanOrEqual(0);
    expect(result.bufferMinutes).toBeLessThan(60);
  });

  it('returns RED when driver cannot arrive in time', () => {
    // Arrange — target is only 1 hour away for a 5+ hour drive
    const input = makeInput({
      targetArrivalUtc: new Date('2026-04-01T09:00:00Z'),
      nowUtc: new Date('2026-04-01T08:00:00Z'),
    });

    // Act
    const result = calculateDeadheadFeasibility(input);

    // Assert
    expect(result.status).toBe('RED');
    expect(result.bufferMinutes).toBeLessThan(0);
  });

  it('returns GREEN with 0 miles when driver is at pickup location', () => {
    // Arrange
    const input = makeInput({
      driverCoords: dallas,
      pickupCoords: dallas,
      targetArrivalUtc: new Date('2026-04-01T18:00:00Z'),
      nowUtc: new Date('2026-04-01T08:00:00Z'),
    });

    // Act
    const result = calculateDeadheadFeasibility(input);

    // Assert
    expect(result.status).toBe('GREEN');
    expect(result.deadheadMiles).toBe(0);
    expect(result.estimatedDriveMinutes).toBe(0);
    expect(result.bufferMinutes).toBe(600); // 10 hours in minutes
  });

  it('returns GREEN when buffer is exactly 60 minutes', () => {
    // Arrange — compute drive time first, then set target exactly 60 min after ETA
    const nowUtc = new Date('2026-04-01T08:00:00Z');
    const preliminary = calculateDeadheadFeasibility(makeInput({ nowUtc }));
    const exactTarget = new Date(
      preliminary.estimatedArrivalUtc.getTime() + 60 * 60_000,
    );
    const input = makeInput({ nowUtc, targetArrivalUtc: exactTarget });

    // Act
    const result = calculateDeadheadFeasibility(input);

    // Assert
    expect(result.status).toBe('GREEN');
    expect(result.bufferMinutes).toBe(60);
  });

  it('returns YELLOW when buffer is exactly 0 minutes', () => {
    // Arrange — target equals estimated arrival
    const nowUtc = new Date('2026-04-01T08:00:00Z');
    const preliminary = calculateDeadheadFeasibility(makeInput({ nowUtc }));
    const exactTarget = new Date(preliminary.estimatedArrivalUtc.getTime());
    const input = makeInput({ nowUtc, targetArrivalUtc: exactTarget });

    // Act
    const result = calculateDeadheadFeasibility(input);

    // Assert
    expect(result.status).toBe('YELLOW');
    expect(result.bufferMinutes).toBe(0);
  });

  it('rounds deadheadMiles to 1 decimal place', () => {
    // Arrange
    const input = makeInput();

    // Act
    const result = calculateDeadheadFeasibility(input);

    // Assert
    const decimalPlaces = result.deadheadMiles.toString().split('.')[1]?.length ?? 0;
    expect(decimalPlaces).toBeLessThanOrEqual(1);
  });

  it('rounds estimatedDriveMinutes to nearest integer', () => {
    // Arrange
    const input = makeInput();

    // Act
    const result = calculateDeadheadFeasibility(input);

    // Assert
    expect(Number.isInteger(result.estimatedDriveMinutes)).toBe(true);
  });
});
