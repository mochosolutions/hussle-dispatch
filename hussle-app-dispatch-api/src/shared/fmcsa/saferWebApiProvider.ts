import type { FmcsaPort } from './fmcsaPort';

// Stub provider for the FMCSA SAFER Web API. Wiring lands in a later story;
// every method throws so accidental use surfaces immediately.

const NOT_IMPLEMENTED_MESSAGE =
  'SaferWebApiProvider not implemented in v1 — see fmcsa-integration PRD § Out of Scope';

export const createSaferWebApiProvider = (): FmcsaPort => ({
  lookupByMcNumber: async () => {
    throw new Error(NOT_IMPLEMENTED_MESSAGE);
  },
  lookupByDotNumber: async () => {
    throw new Error(NOT_IMPLEMENTED_MESSAGE);
  },
});
