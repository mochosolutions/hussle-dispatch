-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "currentLatitude" DECIMAL(9,6),
ADD COLUMN "currentLongitude" DECIMAL(9,6);

-- AlterTable
ALTER TABLE "Load" ADD COLUMN "ratePerTotalMile" DECIMAL(6,2);

-- AlterTable
ALTER TABLE "Settlement" ADD COLUMN "totalTripMiles" INTEGER;
