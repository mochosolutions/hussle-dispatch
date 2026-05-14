import type { FmcsaPort } from '../fmcsaPort';
import type { FmcsaLookupResult } from '../types';
import { createMockFmcsaProvider } from '../mockFmcsaProvider';

// Reusable contract test for any FmcsaPort implementation. Future providers
// (e.g. saferWebApiProvider) can plug into this by registering a new describe
// block via `runFmcsaPortContract`.

export const runFmcsaPortContract = (name: string, makeProvider: () => FmcsaPort): void => {
  describe(`FmcsaPort contract: ${name}`, () => {
    let provider: FmcsaPort;

    beforeEach(() => {
      provider = makeProvider();
    });

    const assertResultShape = (result: FmcsaLookupResult): void => {
      if (result.status === 'found') {
        expect(typeof result.snapshot.mcNumber).toBe('string');
        expect(
          result.snapshot.dotNumber === null || typeof result.snapshot.dotNumber === 'string'
        ).toBe(true);
        expect(typeof result.snapshot.legalName).toBe('string');
        expect(['ACTIVE', 'INACTIVE', 'NOT_AUTHORIZED']).toContain(result.snapshot.authorityStatus);
        expect(result.snapshot.lastCheckedAt).toBeInstanceOf(Date);
        expect(typeof result.snapshot.raw).toBe('object');
        return;
      }
      if (result.status === 'not_found') {
        expect(result.identifier.type === 'mc' || result.identifier.type === 'dot').toBe(true);
        expect(typeof result.identifier.value).toBe('string');
        return;
      }
      if (result.status === 'error') {
        expect(['timeout', 'rate_limit', 'provider_error']).toContain(result.reason);
        expect(result.identifier.type === 'mc' || result.identifier.type === 'dot').toBe(true);
        expect(typeof result.identifier.value).toBe('string');
        return;
      }
      // Exhaustiveness guard — only reachable if a provider returns an unknown status.
      throw new Error(`Unknown result status: ${JSON.stringify(result)}`);
    };

    it('lookupByMcNumber returns a discriminated-union result for a normal input', async () => {
      const result = await provider.lookupByMcNumber('1234567');
      assertResultShape(result);
    });

    it('lookupByDotNumber returns a discriminated-union result for a normal input', async () => {
      const result = await provider.lookupByDotNumber('9876543');
      assertResultShape(result);
    });

    it('both methods produce a status field belonging to the union', async () => {
      const mcResult = await provider.lookupByMcNumber('1234567');
      const dotResult = await provider.lookupByDotNumber('9876543');
      expect(['found', 'not_found', 'error']).toContain(mcResult.status);
      expect(['found', 'not_found', 'error']).toContain(dotResult.status);
    });
  });
};

runFmcsaPortContract('mockFmcsaProvider', () => createMockFmcsaProvider());
