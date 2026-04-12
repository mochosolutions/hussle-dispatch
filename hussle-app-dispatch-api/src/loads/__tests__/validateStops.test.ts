import { describe, expect, it } from '@jest/globals';
import { ValidationError } from '../../shared/errors';
import { validateStops } from '../services/loadService';
import type { StopInput } from '../types/loadTypes';

const makeStop = (overrides: Partial<StopInput> = {}): StopInput => ({
  type: 'PICKUP',
  sequence: 1,
  ...overrides,
});

describe('validateStops', () => {
  it('throws ValidationError for APPOINTMENT stop without appointmentStart', () => {
    const stops: StopInput[] = [
      makeStop({ schedulingType: 'APPOINTMENT' }),
      makeStop({ type: 'DELIVERY', sequence: 2 }),
    ];

    expect(() => validateStops(stops)).toThrow(ValidationError);
    expect(() => validateStops(stops)).toThrow(
      'appointmentStart is required when schedulingType is APPOINTMENT',
    );
  });

  it('throws ValidationError for NOTIFICATION stop without notificationHours', () => {
    const stops: StopInput[] = [
      makeStop({ schedulingType: 'NOTIFICATION' }),
      makeStop({ type: 'DELIVERY', sequence: 2 }),
    ];

    expect(() => validateStops(stops)).toThrow(ValidationError);
    expect(() => validateStops(stops)).toThrow(
      'notificationHours is required when schedulingType is NOTIFICATION',
    );
  });

  it('throws ValidationError for FCFS stop without targetDate', () => {
    const stops: StopInput[] = [
      makeStop({ schedulingType: 'FCFS' }),
      makeStop({ type: 'DELIVERY', sequence: 2 }),
    ];

    expect(() => validateStops(stops)).toThrow(ValidationError);
    expect(() => validateStops(stops)).toThrow(
      'targetDate is required when schedulingType is FCFS',
    );
  });

  it('does not throw for OPEN stop with no date fields', () => {
    const stops: StopInput[] = [
      makeStop({ schedulingType: 'OPEN' }),
      makeStop({ type: 'DELIVERY', sequence: 2 }),
    ];

    expect(() => validateStops(stops)).not.toThrow();
  });

  it('does not throw for DROP_HOOK stop with no date fields', () => {
    const stops: StopInput[] = [
      makeStop({ schedulingType: 'DROP_HOOK' }),
      makeStop({ type: 'DELIVERY', sequence: 2 }),
    ];

    expect(() => validateStops(stops)).not.toThrow();
  });

  it('error message includes stop sequence number', () => {
    const stops: StopInput[] = [
      makeStop({ sequence: 1 }),
      makeStop({ type: 'DELIVERY', sequence: 2, schedulingType: 'FCFS' }),
    ];

    expect(() => validateStops(stops)).toThrow('Stop 2: targetDate is required');
  });

  it('passes when all required fields are present per scheduling type', () => {
    const stops: StopInput[] = [
      makeStop({
        sequence: 1,
        schedulingType: 'APPOINTMENT',
        appointmentStart: new Date(),
      }),
      makeStop({
        sequence: 2,
        schedulingType: 'NOTIFICATION',
        notificationHours: 24,
      }),
      makeStop({
        sequence: 3,
        schedulingType: 'FCFS',
        targetDate: new Date(),
      }),
      makeStop({
        sequence: 4,
        schedulingType: 'OPEN',
      }),
      makeStop({
        type: 'DELIVERY',
        sequence: 5,
        schedulingType: 'DROP_HOOK',
      }),
    ];

    expect(() => validateStops(stops)).not.toThrow();
  });
});
