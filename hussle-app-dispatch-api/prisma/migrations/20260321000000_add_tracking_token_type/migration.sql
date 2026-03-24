-- CreateEnum
CREATE TYPE "TrackingTokenType" AS ENUM ('CUSTOMER', 'DRIVER');

-- AlterTable
ALTER TABLE "LoadTrackingToken" ADD COLUMN "type" "TrackingTokenType" NOT NULL DEFAULT 'CUSTOMER';
