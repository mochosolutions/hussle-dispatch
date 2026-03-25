-- CreateEnum
CREATE TYPE "DriverLicenseType" AS ENUM ('CDL_A', 'CDL_B', 'NON_CDL');

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "licenseType" "DriverLicenseType" NOT NULL DEFAULT 'CDL_A';
