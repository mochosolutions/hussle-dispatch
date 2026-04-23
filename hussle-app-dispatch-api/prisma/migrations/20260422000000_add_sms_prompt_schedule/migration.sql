-- CreateEnum
CREATE TYPE "SmsPromptAnchor" AS ENUM ('DISPATCHED', 'PRE_PICKUP', 'POST_PICKUP', 'TRANSIT_INTERVAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "SmsPromptStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELED');

-- AlterTable: OrgSettings — SMS cadence fields
ALTER TABLE "OrgSettings" ADD COLUMN "smsPrePickupLeadMinutes" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "OrgSettings" ADD COLUMN "smsTransitIntervalMinutes" INTEGER NOT NULL DEFAULT 180;
ALTER TABLE "OrgSettings" ADD COLUMN "smsPostPickupEscalationMinutes" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "OrgSettings" ADD COLUMN "smsCooldownMinutes" INTEGER NOT NULL DEFAULT 15;

-- CreateTable: SmsPromptSchedule
CREATE TABLE "SmsPromptSchedule" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "anchor" "SmsPromptAnchor" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "SmsPromptStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "twilioMessageSid" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsPromptSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmsPromptSchedule_loadId_status_idx" ON "SmsPromptSchedule"("loadId", "status");

-- CreateIndex
CREATE INDEX "SmsPromptSchedule_organizationId_scheduledAt_idx" ON "SmsPromptSchedule"("organizationId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "SmsPromptSchedule" ADD CONSTRAINT "SmsPromptSchedule_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsPromptSchedule" ADD CONSTRAINT "SmsPromptSchedule_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsPromptSchedule" ADD CONSTRAINT "SmsPromptSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
