import { createSaferWebApiProvider } from '../saferWebApiProvider';

describe('saferWebApiProvider (stub)', () => {
  const provider = createSaferWebApiProvider();

  it('lookupByMcNumber rejects with a not-implemented error', async () => {
    await expect(provider.lookupByMcNumber('1234567')).rejects.toThrow(/not implemented/i);
  });

  it('lookupByDotNumber rejects with a not-implemented error', async () => {
    await expect(provider.lookupByDotNumber('9876543')).rejects.toThrow(/not implemented/i);
  });
});
