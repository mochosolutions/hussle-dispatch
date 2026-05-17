-- AlterTable: add fleet-level lane / schedule / freight defaults to Carrier
ALTER TABLE "Carrier" ADD COLUMN "homeBaseCity" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "homeBaseState" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "preferredLanes" JSONB;
ALTER TABLE "Carrier" ADD COLUMN "weeklySchedule" JSONB;
ALTER TABLE "Carrier" ADD COLUMN "freightPreferences" JSONB;
ALTER TABLE "Carrier" ADD COLUMN "maxDaysOut" INTEGER;

-- AlterTable: extend per-driver overrides for schedule and freight (Driver.preferredLanes/maxDaysOut already exist)
ALTER TABLE "Driver" ADD COLUMN "weeklySchedule" JSONB;
ALTER TABLE "Driver" ADD COLUMN "freightPreferences" JSONB;

-- No backfill required: NULL on a driver column means "inherit fleet default".
