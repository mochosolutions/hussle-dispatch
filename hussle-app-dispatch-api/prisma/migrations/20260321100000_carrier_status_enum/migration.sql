-- CreateEnum
CREATE TYPE "CarrierStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'DRAFT');

-- Convert existing lowercase string values to UPPER_CASE before altering column
UPDATE "Carrier" SET "status" = UPPER("status")
  WHERE "status" IN ('active', 'pending', 'suspended', 'draft');

-- Handle the 'approved' value (frontend mismatch) — map to ACTIVE
UPDATE "Carrier" SET "status" = 'ACTIVE'
  WHERE "status" = 'approved';

-- AlterColumn: change from String to CarrierStatus enum
ALTER TABLE "Carrier" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Carrier" ALTER COLUMN "status" TYPE "CarrierStatus" USING "status"::"CarrierStatus";
ALTER TABLE "Carrier" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
