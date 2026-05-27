-- AlterEnum
ALTER TYPE "TrackingTokenType" ADD VALUE 'VEHICLE';

-- AlterTable
ALTER TABLE "LoadTrackingToken" ALTER COLUMN "loadId" DROP NOT NULL,
ADD COLUMN "vehicleId" TEXT,
ADD COLUMN "driverId" TEXT;

-- CreateIndex
CREATE INDEX "LoadTrackingToken_vehicleId_idx" ON "LoadTrackingToken"("vehicleId");
