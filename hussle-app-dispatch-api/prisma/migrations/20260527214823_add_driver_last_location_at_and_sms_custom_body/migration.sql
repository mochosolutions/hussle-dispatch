-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "lastLocationAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SmsPromptSchedule" ADD COLUMN "customBody" TEXT;
