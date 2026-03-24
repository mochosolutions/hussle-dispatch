-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'ON_LOAD', 'INACTIVE', 'OFF_DUTY');

-- AlterTable: Convert Driver.status from String to DriverStatus enum
-- Step 1: Add a temporary column with the enum type
ALTER TABLE "Driver" ADD COLUMN "status_new" "DriverStatus" NOT NULL DEFAULT 'ACTIVE';

-- Step 2: Migrate existing string values to the enum column
UPDATE "Driver" SET "status_new" = CASE
  WHEN "status" = 'active' THEN 'ACTIVE'::"DriverStatus"
  WHEN "status" = 'on_load' THEN 'ON_LOAD'::"DriverStatus"
  WHEN "status" = 'inactive' THEN 'INACTIVE'::"DriverStatus"
  WHEN "status" = 'off_duty' THEN 'OFF_DUTY'::"DriverStatus"
  ELSE 'ACTIVE'::"DriverStatus"
END;

-- Step 3: Drop old column and rename new one
ALTER TABLE "Driver" DROP COLUMN "status";
ALTER TABLE "Driver" RENAME COLUMN "status_new" TO "status";
