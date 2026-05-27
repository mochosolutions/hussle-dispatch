import { createMockFmcsaProvider } from '../mockFmcsaProvider';

describe('mockFmcsaProvider', () => {
  const provider = createMockFmcsaProvider();

  describe('determinism', () => {
    it('returns deep-equal snapshots when lookupByMcNumber is called twice with the same input', async () => {
      const first = await provider.lookupByMcNumber('1234567');
      const second = await provider.lookupByMcNumber('1234567');

      expect(first).toEqual(second);
    });

    it('returns deep-equal snapshots when lookupByDotNumber is called twice with the same input', async () => {
      const first = await provider.lookupByDotNumber('9876543');
      const second = await provider.lookupByDotNumber('9876543');

      expect(first).toEqual(second);
    });

    it('produces different legalName, officerName, and mcNumber for different inputs', async () => {
      const a = await provider.lookupByMcNumber('1234567');
      const b = await provider.lookupByMcNumber('7654321');

      if (a.status !== 'found' || b.status !== 'found') {
        throw new Error('Expected both lookups to return a found snapshot');
      }
      expect(a.snapshot.legalName).not.toBe(b.snapshot.legalName);
      expect(a.snapshot.officerName).not.toBe(b.snapshot.officerName);
      expect(a.snapshot.mcNumber).not.toBe(b.snapshot.mcNumber);
    });
  });

  describe('failure markers', () => {
    it('returns a timeout error result for TIMEOUT via lookupByMcNumber', async () => {
      const result = await provider.lookupByMcNumber('TIMEOUT');

      expect(result).toEqual({
        status: 'error',
        reason: 'timeout',
        identifier: { type: 'mc', value: 'TIMEOUT' },
      });
    });

    it('returns a timeout error result for TIMEOUT via lookupByDotNumber', async () => {
      const result = await provider.lookupByDotNumber('TIMEOUT');

      expect(result).toEqual({
        status: 'error',
        reason: 'timeout',
        identifier: { type: 'dot', value: 'TIMEOUT' },
      });
    });

    it('returns a rate_limit error result for RATELIMIT via lookupByMcNumber', async () => {
      const result = await provider.lookupByMcNumber('RATELIMIT');

      expect(result).toEqual({
        status: 'error',
        reason: 'rate_limit',
        identifier: { type: 'mc', value: 'RATELIMIT' },
      });
    });

    it('returns a rate_limit error result for RATELIMIT via lookupByDotNumber', async () => {
      const result = await provider.lookupByDotNumber('RATELIMIT');

      expect(result).toEqual({
        status: 'error',
        reason: 'rate_limit',
        identifier: { type: 'dot', value: 'RATELIMIT' },
      });
    });

    it('returns not_found for NOTFOUND via lookupByMcNumber', async () => {
      const result = await provider.lookupByMcNumber('NOTFOUND');

      expect(result).toEqual({
        status: 'not_found',
        identifier: { type: 'mc', value: 'NOTFOUND' },
      });
    });

    it('returns not_found for NOTFOUND via lookupByDotNumber', async () => {
      const result = await provider.lookupByDotNumber('NOTFOUND');

      expect(result).toEqual({
        status: 'not_found',
        identifier: { type: 'dot', value: 'NOTFOUND' },
      });
    });

    it('returns not_found for the all-zeros sentinel 0000000 via lookupByMcNumber', async () => {
      const result = await provider.lookupByMcNumber('0000000');

      expect(result).toEqual({
        status: 'not_found',
        identifier: { type: 'mc', value: '0000000' },
      });
    });

    it('returns not_found for the all-zeros sentinel 0000000 via lookupByDotNumber', async () => {
      const result = await provider.lookupByDotNumber('0000000');

      expect(result).toEqual({
        status: 'not_found',
        identifier: { type: 'dot', value: '0000000' },
      });
    });
  });

  describe('snapshot shape', () => {
    it('returns a fully populated snapshot for a normal input', async () => {
      const result = await provider.lookupByMcNumber('1234567');

      if (result.status !== 'found') {
        throw new Error('Expected found snapshot');
      }
      const { snapshot } = result;
      expect(typeof snapshot.mcNumber).toBe('string');
      expect(typeof snapshot.dotNumber).toBe('string');
      expect(typeof snapshot.legalName).toBe('string');
      expect(snapshot.dba).toBeNull();
      expect(typeof snapshot.address).toBe('string');
      expect(snapshot.authorityStatus).toBe('ACTIVE');
      expect(snapshot.safetyRating).toBe('SATISFACTORY');
      expect(typeof snapshot.fleetSize).toBe('number');
      expect(typeof snapshot.officerName).toBe('string');
      expect(snapshot.lastCheckedAt).toBeInstanceOf(Date);
      expect(snapshot.raw.source).toBe('mock');
    });
  });
});
