import { addressSearchValidator } from '../addressSearchValidator';

describe('addressSearchValidator', () => {
  it('accepts query with no bias', async () => {
    await expect(
      addressSearchValidator.validate({ query: { query: 'walmart' } }),
    ).resolves.toBeDefined();
  });

  it('accepts both bias values supplied together', async () => {
    await expect(
      addressSearchValidator.validate({
        query: { query: 'walmart', biasLat: 40.73, biasLng: -73.94 },
      }),
    ).resolves.toBeDefined();
  });

  it('rejects mismatched pair: lat without lng', async () => {
    await expect(
      addressSearchValidator.validate({
        query: { query: 'walmart', biasLat: 40.73 },
      }),
    ).rejects.toThrow();
  });

  it('rejects mismatched pair: lng without lat', async () => {
    await expect(
      addressSearchValidator.validate({
        query: { query: 'walmart', biasLng: -73.94 },
      }),
    ).rejects.toThrow();
  });

  it('rejects out-of-range lat', async () => {
    await expect(
      addressSearchValidator.validate({
        query: { query: 'walmart', biasLat: 91, biasLng: -73 },
      }),
    ).rejects.toThrow();
  });

  it('rejects out-of-range lng', async () => {
    await expect(
      addressSearchValidator.validate({
        query: { query: 'walmart', biasLat: 40, biasLng: 181 },
      }),
    ).rejects.toThrow();
  });
});
