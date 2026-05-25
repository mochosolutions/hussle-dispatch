import { driversValidator } from '../driversValidator';

const validDriver = {
  firstName: 'Isaiah',
  lastName: 'Williams',
  phone: '+17045551234',
  email: 'isaiah@example.com',
  payType: 'PERCENTAGE',
  payRate: 70,
};

describe('driversValidator', () => {
  it('accepts a fully populated driver row', async () => {
    await expect(
      driversValidator.validate({
        body: { hasAdditionalDrivers: true, drivers: [validDriver] },
      }),
    ).resolves.toBeDefined();
  });

  it('accepts an empty drivers array with hasAdditionalDrivers=false', async () => {
    await expect(
      driversValidator.validate({ body: { hasAdditionalDrivers: false, drivers: [] } }),
    ).resolves.toBeDefined();
  });

  it.each(['firstName', 'lastName', 'phone', 'email', 'payType', 'payRate'])(
    'rejects a driver missing required field "%s"',
    async (field) => {
      const driver: Record<string, unknown> = { ...validDriver };
      delete driver[field];
      await expect(
        driversValidator.validate({
          body: { hasAdditionalDrivers: true, drivers: [driver] },
        }),
      ).rejects.toThrow();
    },
  );

  it('rejects an unknown payType', async () => {
    await expect(
      driversValidator.validate({
        body: {
          hasAdditionalDrivers: true,
          drivers: [{ ...validDriver, payType: 'percentage' }],
        },
      }),
    ).rejects.toThrow();
  });

  it('rejects payRate below 0', async () => {
    await expect(
      driversValidator.validate({
        body: { hasAdditionalDrivers: true, drivers: [{ ...validDriver, payRate: -1 }] },
      }),
    ).rejects.toThrow();
  });

  it('rejects payRate above 100', async () => {
    await expect(
      driversValidator.validate({
        body: { hasAdditionalDrivers: true, drivers: [{ ...validDriver, payRate: 101 }] },
      }),
    ).rejects.toThrow();
  });

  it('rejects an invalid email', async () => {
    await expect(
      driversValidator.validate({
        body: { hasAdditionalDrivers: true, drivers: [{ ...validDriver, email: 'not-an-email' }] },
      }),
    ).rejects.toThrow();
  });

  it('rejects drivers array longer than 50', async () => {
    const drivers = Array.from({ length: 51 }, () => validDriver);
    await expect(
      driversValidator.validate({ body: { hasAdditionalDrivers: true, drivers } }),
    ).rejects.toThrow();
  });
});
