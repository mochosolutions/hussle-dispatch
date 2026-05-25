-- ---------------------------------------------------------------------------
-- Drop legacy columns made dead by the carrier-portal Phase 1+2 redesign.
--
-- Carrier:
--   - `dispatchAgreementConsentIp`            — written only by the legacy
--   - `dispatchAgreementConsentUserAgent`       in-portal signature-pad path
--                                               (`portalDocumentsService.signDocument`),
--                                               which was deleted in Track A.
--                                               Never read by any consumer.
--
-- OnboardingSession:
--   - `currentPhase`           — numeric phase tracker. Modern flow uses the
--   - `currentQuestionIndex`     string `currentStepId` field. Both numeric
--                                fields were written only by the legacy
--                                `saveAnswer` endpoint (deleted in Track A)
--                                and never read.
--   - `completedPhases`        — numeric phase-completion array. Replaced by
--                                `completedStepIds`. Final reader was the
--                                completion gate in `onboardingSessionService`,
--                                which now checks `completedStepIds.includes('sign-agreement')`.
-- ---------------------------------------------------------------------------

ALTER TABLE "Carrier"           DROP COLUMN "dispatchAgreementConsentIp";
ALTER TABLE "Carrier"           DROP COLUMN "dispatchAgreementConsentUserAgent";
ALTER TABLE "OnboardingSession" DROP COLUMN "currentPhase";
ALTER TABLE "OnboardingSession" DROP COLUMN "currentQuestionIndex";
ALTER TABLE "OnboardingSession" DROP COLUMN "completedPhases";
