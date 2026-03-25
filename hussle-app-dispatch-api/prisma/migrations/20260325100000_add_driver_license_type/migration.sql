-- CreateEnum
CREATE TYPE "DriverLicenseType" AS ENUM ('CLASS_D', 'CLASS_M', 'CDL_A', 'CDL_B', 'CDL_C');

-- AlterTable: rename CDL fields to license fields
ALTER TABLE "Driver" RENAME COLUMN "cdlNumber" TO "licenseNumber";
ALTER TABLE "Driver" RENAME COLUMN "cdlState" TO "licenseState";
ALTER TABLE "Driver" RENAME COLUMN "cdlExpiry" TO "licenseExpiry";

-- AlterTable: add new fields
ALTER TABLE "Driver" ADD COLUMN "licenseType" "DriverLicenseType" NOT NULL DEFAULT 'CLASS_D';
ALTER TABLE "Driver" ADD COLUMN "endorsements" JSONB;
