-- AlterTable
ALTER TABLE "Load" ADD COLUMN "onboardingOverride" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Load" ADD COLUMN "onboardingOverrideReason" TEXT;
