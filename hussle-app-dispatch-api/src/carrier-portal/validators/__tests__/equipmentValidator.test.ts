import { equipmentValidator } from '../equipmentValidator';

const validVehicle = {
  category: 'SEMI_TRUCK',
  make: 'Kenworth',
  model: 'T680',
  vin: '1XKAD49X8KJ100973',
  licensePlate: 'NC-TR4892',
  gvwr: 80000,
};

describe('equipmentValidator', () => {
  it('accepts a fully populated vehicle row', async () => {
    await expect(
      equipmentValidator.validate({ body: { vehicles: [validVehicle] } }),
    ).resolves.toBeDefined();
  });

  it('accepts gvwr at the 80,000 lb upper bound', async () => {
    await expect(
      equipmentValidator.validate({
        body: { vehicles: [{ ...validVehicle, gvwr: 80000 }] },
      }),
    ).resolves.toBeDefined();
  });

  it('rejects gvwr above 80,000 lbs', async () => {
    await expect(
      equipmentValidator.validate({
        body: { vehicles: [{ ...validVehicle, gvwr: 80001 }] },
      }),
    ).rejects.toThrow();
  });

  it('rejects negative gvwr', async () => {
    await expect(
      equipmentValidator.validate({
        body: { vehicles: [{ ...validVehicle, gvwr: -1 }] },
      }),
    ).rejects.toThrow();
  });

  it('rejects an empty vehicles array', async () => {
    await expect(
      equipmentValidator.validate({ body: { vehicles: [] } }),
    ).rejects.toThrow();
  });

  it('rejects an unknown vehicle category', async () => {
    await expect(
      equipmentValidator.validate({
        body: { vehicles: [{ ...validVehicle, category: 'AIRPLANE' }] },
      }),
    ).rejects.toThrow();
  });
});
