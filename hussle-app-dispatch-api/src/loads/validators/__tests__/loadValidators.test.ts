import { assignLoadValidator, createLoadValidator, updateLoadValidator } from '../loadValidators';

const DISPATCHER_ID = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e';

const baseStop = {
  facilityName: 'Acme',
  address: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  schedulingType: 'APPOINTMENT',
};

const validateCreate = (stops: Record<string, unknown>[]) =>
  createLoadValidator.validate(
    { body: { dispatcherUserId: DISPATCHER_ID, stops } },
    { abortEarly: false },
  );

const validateUpdate = (stops: Record<string, unknown>[]) =>
  updateLoadValidator.validate(
    {
      params: { id: 'a3b4f9c2-1d2e-4a5b-8c9d-0e1f2a3b4c5d' },
      body: { stops },
    },
    { abortEarly: false },
  );

describe('loadValidators delivery-after-pickup', () => {
  it('accepts pickup before delivery', async () => {
    await expect(
      validateCreate([
        { ...baseStop, type: 'PICKUP', sequence: 0, appointmentStart: '2026-05-01T10:00:00Z' },
        { ...baseStop, type: 'DELIVERY', sequence: 1, appointmentStart: '2026-05-02T10:00:00Z' },
      ]),
    ).resolves.toBeDefined();
  });

  it('accepts pickup and delivery on same time', async () => {
    await expect(
      validateCreate([
        { ...baseStop, type: 'PICKUP', sequence: 0, appointmentStart: '2026-05-01T10:00:00Z' },
        { ...baseStop, type: 'DELIVERY', sequence: 1, appointmentStart: '2026-05-01T10:00:00Z' },
      ]),
    ).resolves.toBeDefined();
  });

  it('rejects when delivery is before pickup', async () => {
    await expect(
      validateCreate([
        { ...baseStop, type: 'PICKUP', sequence: 0, appointmentStart: '2026-05-02T10:00:00Z' },
        { ...baseStop, type: 'DELIVERY', sequence: 1, appointmentStart: '2026-05-01T10:00:00Z' },
      ]),
    ).rejects.toThrow(/Delivery date cannot be earlier than pickup date/);
  });

  it('rejects when earliest delivery is before latest pickup (multi-pickup)', async () => {
    await expect(
      validateCreate([
        { ...baseStop, type: 'PICKUP', sequence: 0, appointmentStart: '2026-05-01T08:00:00Z' },
        { ...baseStop, type: 'PICKUP', sequence: 1, appointmentStart: '2026-05-02T08:00:00Z' },
        { ...baseStop, type: 'DELIVERY', sequence: 2, appointmentStart: '2026-05-01T20:00:00Z' },
      ]),
    ).rejects.toThrow(/Delivery date cannot be earlier than pickup date/);
  });

  it('accepts multi-delivery when each is after latest pickup', async () => {
    await expect(
      validateCreate([
        { ...baseStop, type: 'PICKUP', sequence: 0, appointmentStart: '2026-05-01T08:00:00Z' },
        { ...baseStop, type: 'DELIVERY', sequence: 1, appointmentStart: '2026-05-02T08:00:00Z' },
        { ...baseStop, type: 'DELIVERY', sequence: 2, appointmentStart: '2026-05-03T08:00:00Z' },
      ]),
    ).resolves.toBeDefined();
  });

  it('skips check when no DELIVERY stops are provided', async () => {
    await expect(
      validateCreate([
        { ...baseStop, type: 'PICKUP', sequence: 0, appointmentStart: '2026-05-01T08:00:00Z' },
      ]),
    ).resolves.toBeDefined();
  });

  it('enforces the rule on updates too', async () => {
    await expect(
      validateUpdate([
        { ...baseStop, type: 'PICKUP', sequence: 0, appointmentStart: '2026-05-02T10:00:00Z' },
        { ...baseStop, type: 'DELIVERY', sequence: 1, appointmentStart: '2026-05-01T10:00:00Z' },
      ]),
    ).rejects.toThrow(/Delivery date cannot be earlier than pickup date/);
  });
});

describe('loadValidators dispatcher required', () => {
  const validStops = [
    { ...baseStop, type: 'PICKUP', sequence: 0, appointmentStart: '2026-05-01T10:00:00Z' },
    { ...baseStop, type: 'DELIVERY', sequence: 1, appointmentStart: '2026-05-02T10:00:00Z' },
  ];

  it('rejects create when dispatcherUserId is missing', async () => {
    await expect(
      createLoadValidator.validate({ body: { stops: validStops } }, { abortEarly: false }),
    ).rejects.toThrow(/Dispatcher is required/);
  });

  it('rejects assignment when dispatcherUserId is missing', async () => {
    await expect(
      assignLoadValidator.validate(
        {
          params: { id: 'a3b4f9c2-1d2e-4a5b-8c9d-0e1f2a3b4c5d' },
          body: { carrierId: 'c1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e' },
        },
        { abortEarly: false },
      ),
    ).rejects.toThrow(/Dispatcher is required/);
  });

  it('accepts assignment when dispatcherUserId is provided', async () => {
    await expect(
      assignLoadValidator.validate(
        {
          params: { id: 'a3b4f9c2-1d2e-4a5b-8c9d-0e1f2a3b4c5d' },
          body: { dispatcherUserId: DISPATCHER_ID },
        },
        { abortEarly: false },
      ),
    ).resolves.toBeDefined();
  });
});
