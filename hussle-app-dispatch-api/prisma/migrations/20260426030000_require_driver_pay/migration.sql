-- Backfill any existing drivers missing pay configuration so the columns can become NOT NULL.
-- Default chosen 2026-04-26 (Track 7 plan): PERCENTAGE / 30 mirrors a typical owner-operator split.
-- Dispatchers can edit per-driver after the migration; new drivers will be required to set pay at creation.

UPDATE "Driver"
SET "payType" = 'PERCENTAGE'
WHERE "payType" IS NULL;

UPDATE "Driver"
SET "payRate" = 30
WHERE "payRate" IS NULL;

ALTER TABLE "Driver"
  ALTER COLUMN "payType" SET NOT NULL,
  ALTER COLUMN "payRate" SET NOT NULL;
