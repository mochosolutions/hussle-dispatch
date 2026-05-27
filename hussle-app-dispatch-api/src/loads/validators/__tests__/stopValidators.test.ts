import { createStopSchema } from '../stopValidators';

const baseStop = {
  type: 'PICKUP',
  facilityName: 'Acme Warehouse',
  address: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
};

const validate = (body: Record<string, unknown>) =>
  createStopSchema.validate(
    { params: { loadId: 'a3b4f9c2-1d2e-4a5b-8c9d-0e1f2a3b4c5d' }, body },
    { abortEarly: false },
  );

describe('createStopSchema appointmentStart', () => {
  it.each(['APPOINTMENT', 'FCFS', 'NOTIFICATION', 'OPEN', 'DROP_HOOK'])(
    'requires appointmentStart for %s',
    async (schedulingType) => {
      await expect(validate({ ...baseStop, schedulingType })).rejects.toThrow(
        /Appointment date is required/,
      );
    },
  );

  it('rejects empty-string appointmentStart for APPOINTMENT', async () => {
    await expect(
      validate({ ...baseStop, schedulingType: 'APPOINTMENT', appointmentStart: '' }),
    ).rejects.toThrow(/Appointment date is required/);
  });

  it('rejects empty-string appointmentStart for DROP_HOOK', async () => {
    await expect(
      validate({ ...baseStop, schedulingType: 'DROP_HOOK', appointmentStart: '' }),
    ).rejects.toThrow(/Appointment date is required/);
  });

  it('accepts a valid ISO date for APPOINTMENT', async () => {
    await expect(
      validate({
        ...baseStop,
        schedulingType: 'APPOINTMENT',
        appointmentStart: '2026-05-01T14:00:00.000Z',
      }),
    ).resolves.toBeDefined();
  });

  it('accepts a valid ISO date for DROP_HOOK', async () => {
    await expect(
      validate({
        ...baseStop,
        schedulingType: 'DROP_HOOK',
        appointmentStart: '2026-05-01T14:00:00.000Z',
      }),
    ).resolves.toBeDefined();
  });

  it('rejects an invalid date string', async () => {
    await expect(
      validate({
        ...baseStop,
        schedulingType: 'APPOINTMENT',
        appointmentStart: 'not-a-date',
      }),
    ).rejects.toThrow();
  });
});
