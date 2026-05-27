-- AlterTable: add v2 step-id tracking columns to OnboardingSession
ALTER TABLE "OnboardingSession" ADD COLUMN "currentStepId" TEXT;
ALTER TABLE "OnboardingSession" ADD COLUMN "completedStepIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill currentStepId from currentPhase
UPDATE "OnboardingSession" SET "currentStepId" = CASE "currentPhase"
  WHEN 1 THEN 'welcome-segmentation'
  WHEN 2 THEN 'company-authority-question'
  WHEN 3 THEN 'equipment-entry'
  WHEN 4 THEN 'drivers-has-employees'
  WHEN 5 THEN 'cost-analysis'
  WHEN 6 THEN 'lane-preferences'
  WHEN 7 THEN 'documents-upload'
  WHEN 8 THEN 'complete'
  ELSE 'welcome-segmentation'
END WHERE "currentStepId" IS NULL;

-- Backfill completedStepIds: collect first stepId of each phase up to (currentPhase - 1)
UPDATE "OnboardingSession" SET "completedStepIds" = (
  SELECT COALESCE(array_agg(step_id), ARRAY[]::text[])
  FROM (VALUES
    (1, 'welcome-segmentation'),
    (2, 'company-authority-question'),
    (3, 'equipment-entry'),
    (4, 'drivers-has-employees'),
    (5, 'cost-analysis'),
    (6, 'lane-preferences'),
    (7, 'documents-upload')
  ) AS phases(phase, step_id)
  WHERE phases.phase < "OnboardingSession"."currentPhase"
) WHERE "completedStepIds" = ARRAY[]::text[];
