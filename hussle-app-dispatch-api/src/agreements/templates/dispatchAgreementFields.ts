/**
 * Typed constants for the DispatchAgreement DocuSeal template field names.
 *
 * These names MUST match the named fields in the DocuSeal DispatchAgreement template
 * (one template per environment, configured via DOCUSEAL_DISPATCH_TEMPLATE_ID env var).
 *
 * See docs/runbooks/docuseal-template-setup.md for setup instructions and field reference.
 *
 * Drift between this file and DocuSeal admin UI fields → silent pre-fill miss
 * (DocuSeal accepts unknown keys silently). Coordinate updates with admin UI changes.
 */
export const DISPATCH_AGREEMENT_FIELDS = Object.freeze({
  CARRIER_LEGAL_NAME: 'carrier_legal_name',
  CARRIER_MC_NUMBER: 'mc_number',
  CARRIER_DOT_NUMBER: 'dot_number',
  DISPATCHER_ORG_NAME: 'dispatcher_org_name',
  EFFECTIVE_DATE: 'effective_date',
} as const);

export type DispatchAgreementFieldName =
  (typeof DISPATCH_AGREEMENT_FIELDS)[keyof typeof DISPATCH_AGREEMENT_FIELDS];
