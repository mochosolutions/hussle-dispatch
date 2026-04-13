/*
  Warnings:

  - The `onboardingStatus` column on the `Carrier` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('SEMI_TRUCK', 'BOX_TRUCK', 'CARGO_VAN', 'PERSONAL_VEHICLE');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Carrier" ADD COLUMN     "costProfileSource" TEXT,
ADD COLUMN     "costProfileVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dispatchAgreementConsentIp" TEXT,
ADD COLUMN     "dispatchAgreementConsentUserAgent" TEXT,
ADD COLUMN     "entryMethod" TEXT DEFAULT 'INVITE',
ADD COLUMN     "fuelCardProviders" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "howFoundUs" TEXT,
ADD COLUMN     "inviteSentAt" TIMESTAMP(3),
ADD COLUMN     "minimumRatePerMile" DECIMAL(6,2),
DROP COLUMN "onboardingStatus",
ADD COLUMN     "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewStatus" TEXT DEFAULT 'pending_review',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByUserId" TEXT,
ADD COLUMN     "signatureData" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3),
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "category" "VehicleCategory",
ADD COLUMN     "deliveryTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "gvwr" INTEGER,
ADD COLUMN     "insuranceMonthlyCost" DECIMAL(10,2),
ADD COLUMN     "lenderName" TEXT,
ADD COLUMN     "loanInterestRate" DECIMAL(5,2),
ADD COLUMN     "loanPayment" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "OnboardingSession" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "currentPhase" INTEGER NOT NULL DEFAULT 1,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB,
    "completedPhases" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrierInviteToken" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarrierInviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSession_carrierId_key" ON "OnboardingSession"("carrierId");

-- CreateIndex
CREATE INDEX "OnboardingSession_carrierId_idx" ON "OnboardingSession"("carrierId");

-- CreateIndex
CREATE UNIQUE INDEX "CarrierInviteToken_token_key" ON "CarrierInviteToken"("token");

-- CreateIndex
CREATE INDEX "CarrierInviteToken_carrierId_idx" ON "CarrierInviteToken"("carrierId");

-- CreateIndex
CREATE INDEX "CarrierInviteToken_token_idx" ON "CarrierInviteToken"("token");

-- AddForeignKey
ALTER TABLE "OnboardingSession" ADD CONSTRAINT "OnboardingSession_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrierInviteToken" ADD CONSTRAINT "CarrierInviteToken_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrierInviteToken" ADD CONSTRAINT "CarrierInviteToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
