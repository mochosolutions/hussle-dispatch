-- AlterTable: promote company/W-9/signatory fields from answers JSON to first-class Carrier columns
ALTER TABLE "Carrier" ADD COLUMN "legalName" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "dbaName" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "taxClassification" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "tin" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "tinType" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "signatoryName" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "signatoryTitle" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "signedAgreementId" TEXT;

-- Backfill legalName from existing name (best-effort copy; refined later by reads from answers JSON if richer data exists)
UPDATE "Carrier" SET "legalName" = "name" WHERE "legalName" IS NULL AND "name" IS NOT NULL;
