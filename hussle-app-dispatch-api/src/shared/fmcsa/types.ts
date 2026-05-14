// FMCSA domain types and service contract.

export interface FmcsaIdentifier {
  type: 'mc' | 'dot';
  value: string;
}

export interface FmcsaSnapshot {
  mcNumber: string;
  dotNumber: string | null;
  legalName: string;
  dba: string | null;
  address: string | null;
  authorityStatus: 'ACTIVE' | 'INACTIVE' | 'NOT_AUTHORIZED';
  safetyRating: 'SATISFACTORY' | 'CONDITIONAL' | 'UNSATISFACTORY' | 'UNRATED' | null;
  fleetSize: number | null;
  officerName: string | null;
  lastCheckedAt: Date;
  raw: Record<string, unknown>;
}

export interface FmcsaLookupResultFound {
  status: 'found';
  snapshot: FmcsaSnapshot;
}

export interface FmcsaLookupResultNotFound {
  status: 'not_found';
  identifier: FmcsaIdentifier;
}

export interface FmcsaLookupResultError {
  status: 'error';
  reason: 'timeout' | 'rate_limit' | 'provider_error';
  identifier: FmcsaIdentifier;
}

export type FmcsaLookupResult =
  | FmcsaLookupResultFound
  | FmcsaLookupResultNotFound
  | FmcsaLookupResultError;

export interface FmcsaLookupOpts {
  skipCache?: boolean;
  correlationId?: string;
}

export interface FmcsaService {
  lookupByMcNumber(mc: string, opts?: FmcsaLookupOpts): Promise<FmcsaLookupResult>;
  lookupByDotNumber(dot: string, opts?: FmcsaLookupOpts): Promise<FmcsaLookupResult>;
  invalidateCache(identifier: FmcsaIdentifier): Promise<void>;
}
