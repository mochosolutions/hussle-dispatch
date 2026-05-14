import type { FmcsaPort } from './fmcsaPort';
import type { FmcsaIdentifier, FmcsaLookupResult, FmcsaSnapshot } from './types';

// Deterministic mock FMCSA provider. Pure function dressed up as a port — no
// state, no I/O. Reserved input values trigger configured failure modes so
// downstream services can be exercised against the discriminated-union contract
// without hitting a real provider.

const FIXED_LAST_CHECKED_AT = new Date('2026-01-01T00:00:00.000Z');

const padTo7 = (s: string): string => s.padStart(7, '0').slice(-7);

const deriveOtherNumber = (value: string): string => {
  // Produces a deterministic counterpart identifier value: for an MC value
  // '1234567', the DOT value is '9' + last 6 chars padded, and vice versa.
  const padded = padTo7(value);
  return `9${padded.slice(1)}`;
};

const buildSnapshot = (identifier: FmcsaIdentifier): FmcsaSnapshot => {
  const mcNumber =
    identifier.type === 'mc' ? padTo7(identifier.value) : deriveOtherNumber(identifier.value);
  const dotNumber =
    identifier.type === 'dot' ? padTo7(identifier.value) : deriveOtherNumber(identifier.value);
  const fleetDigits = identifier.value.replace(/\D/g, '').slice(-2);
  const fleetSize = fleetDigits === '' ? 1 : parseInt(fleetDigits, 10) + 1;
  return {
    mcNumber,
    dotNumber,
    legalName: `Mock Carrier ${identifier.value}`,
    dba: null,
    address: '1 Mock St, Mock City, MC 00000',
    authorityStatus: 'ACTIVE',
    safetyRating: 'SATISFACTORY',
    fleetSize,
    officerName: `Officer ${identifier.value}`,
    lastCheckedAt: FIXED_LAST_CHECKED_AT,
    raw: {
      source: 'mock',
      queriedType: identifier.type,
      queriedValue: identifier.value,
    },
  };
};

const buildResult = (identifier: FmcsaIdentifier): FmcsaLookupResult => {
  if (identifier.value === 'TIMEOUT') {
    return { status: 'error', reason: 'timeout', identifier };
  }
  if (identifier.value === 'RATELIMIT') {
    return { status: 'error', reason: 'rate_limit', identifier };
  }
  if (identifier.value === 'NOTFOUND' || identifier.value === '0000000') {
    return { status: 'not_found', identifier };
  }
  return { status: 'found', snapshot: buildSnapshot(identifier) };
};

export const createMockFmcsaProvider = (): FmcsaPort => ({
  lookupByMcNumber: async (mc) => buildResult({ type: 'mc', value: mc }),
  lookupByDotNumber: async (dot) => buildResult({ type: 'dot', value: dot }),
});
