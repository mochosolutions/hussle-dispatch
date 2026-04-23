-- Unify stop date fields: merge targetDate into appointmentStart, remove denormalized facility hours.

-- Step 1: Copy targetDate into appointmentStart where appointmentStart is null
UPDATE "Stop"
SET "appointmentStart" = "targetDate"
WHERE "appointmentStart" IS NULL AND "targetDate" IS NOT NULL;

-- Step 2: For stops with neither, use createdAt as fallback
UPDATE "Stop"
SET "appointmentStart" = "createdAt"
WHERE "appointmentStart" IS NULL;

-- Step 3: Make appointmentStart non-nullable
ALTER TABLE "Stop" ALTER COLUMN "appointmentStart" SET NOT NULL;

-- Step 4: Drop removed columns
ALTER TABLE "Stop" DROP COLUMN "targetDate";
ALTER TABLE "Stop" DROP COLUMN "facilityOpenTime";
ALTER TABLE "Stop" DROP COLUMN "facilityCloseTime";
