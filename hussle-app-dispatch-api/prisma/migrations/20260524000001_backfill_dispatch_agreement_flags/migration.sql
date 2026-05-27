-- ---------------------------------------------------------------------------
-- Data backfill for two pre-existing inconsistencies surfaced by Phase 1+2 of
-- the carrier-portal redesign.
--
-- (1) `Carrier.dispatchAgreementOnFile` lockstep.
--
-- Pre-Phase-2, `setSignedAgreementId` (the agreement.signed projection) only
-- wrote `signedAgreementId` and `dispatchAgreementSignedAt`. The legacy
-- boolean `dispatchAgreementOnFile` was historically written only by the
-- in-portal signature-pad path (`portalDocumentsService.signDocument`), which
-- isn't used by the DocuSeal/mock flow. That left every carrier signed under
-- the modern flow with `dispatchAgreementOnFile = false`, even though they
-- have a SIGNED agreement on the Agreement table.
--
-- `checkCarrierOnboarding` and the loads service both read the boolean. The
-- mismatch caused `complete()` to throw `OnboardingBlockError` for carriers
-- who had actually completed all required signing.
--
-- The Phase 2 commit fixes the projection to write the boolean in lockstep,
-- but pre-existing rows need backfilling.
--
-- (2) `OnboardingSession.currentStepId` stranded on the deleted step.
--
-- Phase 1 deleted the standalone `documents-upload` step and merged COI
-- upload into `sign-agreement`. Any session whose cursor still points at
-- `'documents-upload'` can't render any UI (the schema lookup returns
-- undefined). Bounce these sessions back to `sign-agreement` so the carrier
-- lands on the consolidated step and can complete onboarding.
-- ---------------------------------------------------------------------------

UPDATE "Carrier"
SET "dispatchAgreementOnFile" = TRUE
WHERE "signedAgreementId" IS NOT NULL
  AND "dispatchAgreementSignedAt" IS NOT NULL
  AND "dispatchAgreementOnFile" = FALSE;

UPDATE "OnboardingSession"
SET "currentStepId" = 'sign-agreement'
WHERE "currentStepId" = 'documents-upload';
