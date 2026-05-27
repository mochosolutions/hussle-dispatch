import { describe, expect, it } from '@jest/globals';
import { ValidationError } from '../../shared/errors';
import { validateStops } from '../services/loadService';
import type { StopInput } from '../types/loadTypes';

const makeStop = (overrides: Partial<StopInput> = {}): StopInput => ({
  type: 'PICKUP',
  sequence: 1,
  appointmentStart: new Date(),
  ...overrides,
});

describe('validateStops', () => {
  it('throws ValidationError when stop has no appointmentStart', () => {
    const stops: StopInput[] = [
      { type: 'PICKUP', sequence: 1, appointmentStart: null as unknown as Date },
      makeStop({ type: 'DELIVERY', sequence: 2 }),
    ];

    expect(() => validateStops(stops)).toThrow(ValidationError);
    expect(() => validateStops(stops)).toThrow(
      'appointmentStart is required',
    );
  });

  it('throws ValidationError for NOTIFICATION stop without contactName', () => {
    const stops: StopInput[] = [
      makeStop({ schedulingType: 'NOTIFICATION' }),
      makeStop({ type: 'DELIVERY', sequence: 2 }),
    ];

    expect(() => validateStops(stops)).toThrow(ValidationError);
    expect(() => validateStops(stops)).toThrow(
      'contactName is required when schedulingType is NOTIFICATION',
    );
  });

  it('error message includes stop sequence number', () => {
    const stops: StopInput[] = [
      makeStop({ sequence: 1 }),
      { type: 'DELIVERY', sequence: 2, appointmentStart: null as unknown as Date },
    ];

    expect(() => validateStops(stops)).toThrow('Stop 2: appointmentStart is required');
  });

  it('passes when all required fields are present per scheduling type', () => {
    const stops: StopInput[] = [
      makeStop({
        sequence: 1,
        schedulingType: 'APPOINTMENT',
      }),
      makeStop({
        sequence: 2,
        schedulingType: 'FCFS',
      }),
      makeStop({
        sequence: 3,
        schedulingType: 'NOTIFICATION',
        contactName: 'John',
        contactPhone: '555-1234',
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
