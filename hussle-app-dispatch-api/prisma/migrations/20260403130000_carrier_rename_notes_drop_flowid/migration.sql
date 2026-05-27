-- Rename Carrier.notes to Carrier.description
ALTER TABLE "Carrier" RENAME COLUMN "notes" TO "description";

-- Drop unused onboardingFlowId column
ALTER TABLE "Carrier" DROP COLUMN "onboardingFlowId";
