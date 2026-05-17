// Single source of truth for the dot-paths that lock after the dispatch agreement is signed.
// Imported by:
//   - portalCompanyService (server-side rejection of mutations with HTTP 422 FIELD_LOCKED)
//   - portalService submit-step handler (forwards locked-field mutation rejections)
// The UI keeps a parallel constant at
//   hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/locksFields.ts
// A parity test asserts the two lists carry the same 8 paths in the same order.

export const LOCKS_FIELDS = [
  'company.legalName',
  'company.mcNumber',
  'company.dotNumber',
  'company.signatoryName',
  'company.signatoryTitle',
  'company.taxClassification',
  'company.tinType',
  'company.tin',
] as const;

export type LockedFieldPath = (typeof LOCKS_FIELDS)[number];

const COMPANY_FIELD_TO_DOT_PATH: Record<string, LockedFieldPath | undefined> = {
  legalName: 'company.legalName',
  mcNumber: 'company.mcNumber',
  dotNumber: 'company.dotNumber',
  signatoryName: 'company.signatoryName',
  signatoryTitle: 'company.signatoryTitle',
  taxClassification: 'company.taxClassification',
  tinType: 'company.tinType',
  tin: 'company.tin',
};

export const companyFieldLockedPath = (field: string): LockedFieldPath | null =>
  COMPANY_FIELD_TO_DOT_PATH[field] ?? null;
