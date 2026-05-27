/*
  Warnings:

  - You are about to drop the column `tripId` on the `Load` table. All the data in the column will be lost.
  - You are about to drop the `Trip` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Load" DROP CONSTRAINT "Load_tripId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_vehicleId_fkey";

-- DropIndex
DROP INDEX "Load_tripId_idx";

-- AlterTable
ALTER TABLE "Load" DROP COLUMN "tripId";

-- DropTable
DROP TABLE "Trip";

-- DropEnum
DROP TYPE "TripStatus";
