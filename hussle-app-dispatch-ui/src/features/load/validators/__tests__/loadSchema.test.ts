import { loadSchema } from '../loadSchema';

const baseLoad = {
  customerId: 'cust-1',
  carrierId: 'car-1',
  dispatcherUserId: 'disp-1',
  equipmentType: 'DRY_VAN',
  customerRate: 1000,
};

const baseStop = {
  facilityName: 'Acme',
  address: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  schedulingType: 'APPOINTMENT',
};

const validate = (stops: Record<string, unknown>[]) =>
  loadSchema.validate({ ...baseLoad, stops }, { abortEarly: false });

describe('loadSchema delivery-after-pickup', () => {
  it('accepts pickup before delivery', async () => {
    await expect(
      validate([
        {
          ...baseStop,
          type: 'PICKUP',
          sequence: 0,
          appointmentDate: '2026-05-01',
          appointmentTime: '10:00',
        },
        {
          ...baseStop,
          type: 'DELIVERY',
          sequence: 1,
          appointmentDate: '2026-05-02',
          appointmentTime: '10:00',
        },
      ]),
    ).resolves.toBeDefined();
  });

  it('accepts pickup and delivery on same date+time', async () => {
    await expect(
      validate([
        {
          ...baseStop,
          type: 'PICKUP',
          sequence: 0,
          appointmentDate: '2026-05-01',
          appointmentTime: '10:00',
        },
        {
          ...baseStop,
          type: 'DELIVERY',
          sequence: 1,
          appointmentDate: '2026-05-01',
          appointmentTime: '10:00',
        },
      ]),
    ).resolves.toBeDefined();
  });

  it('rejects when delivery is before pickup', async () => {
    await expect(
      validate([
        {
          ...baseStop,
          type: 'PICKUP',
          sequence: 0,
          appointmentDate: '2026-05-02',
          appointmentTime: '10:00',
        },
        {
          ...baseStop,
          type: 'DELIVERY',
          sequence: 1,
          appointmentDate: '2026-05-01',
          appointmentTime: '10:00',
        },
      ]),
    ).rejects.toThrow(/Delivery date cannot be earlier than pickup date/);
  });

  it('rejects when delivery is earlier in the day than pickup on same date', async () => {
    await expect(
      validate([
        {
          ...baseStop,
          type: 'PICKUP',
          sequence: 0,
          appointmentDate: '2026-05-01',
          appointmentTime: '14:00',
        },
        {
          ...baseStop,
          type: 'DELIVERY',
          sequence: 1,
          appointmentDate: '2026-05-01',
          appointmentTime: '10:00',
        },
      ]),
    ).rejects.toThrow(/Delivery date cannot be earlier than pickup date/);
  });

  it('rejects when earliest delivery is before latest pickup (multi-pickup)', async () => {
    await expect(
      validate([
        {
          ...baseStop,
          type: 'PICKUP',
          sequence: 0,
          appointmentDate: '2026-05-01',
          appointmentTime: '08:00',
        },
        {
          ...baseStop,
          type: 'PICKUP',
          sequence: 1,
          appointmentDate: '2026-05-02',
          appointmentTime: '08:00',
        },
        {
          ...baseStop,
          type: 'DELIVERY',
          sequence: 2,
          appointmentDate: '2026-05-01',
          appointmentTime: '20:00',
        },
      ]),
    ).rejects.toThrow(/Delivery date cannot be earlier than pickup date/);
  });

  it('accepts multi-delivery when each is after latest pickup', async () => {
    await expect(
      validate([
        {
          ...baseStop,
          type: 'PICKUP',
          sequence: 0,
          appointmentDate: '2026-05-01',
          appointmentTime: '08:00',
        },
        {
          ...baseStop,
          type: 'DELIVERY',
          sequence: 1,
          appointmentDate: '2026-05-02',
          appointmentTime: '08:00',
        },
        {
          ...baseStop,
          type: 'DELIVERY',
          sequence: 2,
          appointmentDate: '2026-05-03',
          appointmentTime: '08:00',
        },
      ]),
    ).resolves.toBeDefined();
  });

  it('treats date-only (no time) as midnight and still validates correctly', async () => {
    await expect(
      validate([
        {
          ...baseStop,
          type: 'PICKUP',
          sequence: 0,
          appointmentDate: '2026-05-02',
        },
        {
          ...baseStop,
          type: 'DELIVERY',
          sequence: 1,
          appointmentDate: '2026-05-01',
        },
      ]),
    ).rejects.toThrow(/Delivery date cannot be earlier than pickup date/);
  });

  it('skips check when appointmentDate is missing on all stops (other validators handle that)', async () => {
    // appointmentDate is required by the schema; with both blank it'll fail required first.
    // The delivery-after-pickup check itself should not throw on missing dates.
    await expect(
      validate([
        { ...baseStop, type: 'PICKUP', sequence: 0 },
        { ...baseStop, type: 'DELIVERY', sequence: 1 },
      ]),
    ).rejects.toMatchObject({
      errors: expect.arrayContaining([expect.stringMatching(/Appointment date is required/)]),
    });
  });

  it('skips check when no DELIVERY stops are provided (fails has-delivery instead)', async () => {
    await expect(
      validate([
        {
          ...baseStop,
          type: 'PICKUP',
          sequence: 0,
          appointmentDate: '2026-05-01',
          appointmentTime: '08:00',
        },
      ]),
    ).rejects.toThrow(/At least one delivery stop is required/);
  });
});

describe('loadSchema dispatcher required', () => {
  const validStops = [
    {
      ...baseStop,
      type: 'PICKUP',
      sequence: 0,
      appointmentDate: '2026-05-01',
      appointmentTime: '10:00',
    },
    {
      ...baseStop,
      type: 'DELIVERY',
      sequence: 1,
      appointmentDate: '2026-05-02',
      appointmentTime: '10:00',
    },
  ];

  it('rejects when dispatcherUserId is missing', async () => {
    const { dispatcherUserId: _omitted, ...loadWithoutDispatcher } = baseLoad;
    await expect(
      loadSchema.validate(
        { ...loadWithoutDispatcher, stops: validStops },
        { abortEarly: false },
      ),
    ).rejects.toThrow(/Dispatcher is required/);
  });

  it('accepts when dispatcherUserId is provided', async () => {
    await expect(validate(validStops)).resolves.toBeDefined();
  });
});
