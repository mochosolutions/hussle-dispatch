import type { FmcsaLookupResult } from './types';

export interface FmcsaPort {
  lookupByMcNumber(mc: string): Promise<FmcsaLookupResult>;
  lookupByDotNumber(dot: string): Promise<FmcsaLookupResult>;
}
