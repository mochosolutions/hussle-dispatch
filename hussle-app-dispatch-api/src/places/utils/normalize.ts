/**
 * Application-side mirror of Postgres `normalize_dedupe(text)`.
 *
 * Semantics: case-fold, edge-trim, collapse internal whitespace to a single
 * space. NO punctuation stripping. Must stay in lock-step with the Postgres
 * function defined in migration 20260502000000_auto_place_resolution_v1.
 * Parity is asserted by `__tests__/normalizeDedupeParity.test.ts`.
 */
export const normalize = (s: string | null | undefined): string =>
  (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
