import { checkInSchema } from '../driverPortalValidators';

const validate = (body: Record<string, unknown>) =>
  checkInSchema.validate({ body }, { abortEarly: false });

describe('checkInSchema latitude/longitude bounds', () => {
  it('accepts valid coordinates', async () => {
    await expect(validate({ latitude: 36.1627, longitude: -86.7816 })).resolves.toBeDefined();
  });

  it('accepts boundary coordinates (-90/90, -180/180)', async () => {
    await expect(validate({ latitude: -90, longitude: -180 })).resolves.toBeDefined();
    await expect(validate({ latitude: 90, longitude: 180 })).resolves.toBeDefined();
  });

  it('rejects latitude below -90', async () => {
    await expect(validate({ latitude: -90.0001, longitude: 0 })).rejects.toThrow();
  });

  it('rejects latitude above 90', async () => {
    await expect(validate({ latitude: 90.0001, longitude: 0 })).rejects.toThrow();
  });

  it('rejects longitude below -180', async () => {
    await expect(validate({ latitude: 0, longitude: -180.0001 })).rejects.toThrow();
  });

  it('rejects longitude above 180', async () => {
    await expect(validate({ latitude: 0, longitude: 180.0001 })).rejects.toThrow();
  });

  it('accepts notes-only payloads with no coords', async () => {
    await expect(validate({ notes: 'On the road' })).resolves.toBeDefined();
  });
});
