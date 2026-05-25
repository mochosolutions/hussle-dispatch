-- Drop derived Carrier compliance cache columns.
-- These values are now computed on-read via shared/scoring/derivedCompliance.ts
-- from the Document/Agreement tables (Phase 1 derived-values-removal, US-06).
ALTER TABLE "Carrier"
  DROP COLUMN "dispatchAgreementOnFile",
  DROP COLUMN "dispatchAgreementSignedAt",
  DROP COLUMN "insuranceCertOnFile",
  DROP COLUMN "insuranceExpiry",
  DROP COLUMN "signedAgreementId";
