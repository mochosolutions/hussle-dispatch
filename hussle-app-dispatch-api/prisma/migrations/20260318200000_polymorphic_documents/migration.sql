-- Add new enum values
ALTER TYPE "DocumentType" ADD VALUE 'POD';
ALTER TYPE "DocumentType" ADD VALUE 'HAZMAT';
ALTER TYPE "DocumentType" ADD VALUE 'LOA';
ALTER TYPE "DocumentType" ADD VALUE 'DETENTION';
ALTER TYPE "DocumentType" ADD VALUE 'LICENSE';
ALTER TYPE "DocumentType" ADD VALUE 'REGISTRATION';
ALTER TYPE "DocumentType" ADD VALUE 'INSPECTION_CERT';

-- Add polymorphic columns (nullable for backfill)
ALTER TABLE "Document" ADD COLUMN "entityType" TEXT;
ALTER TABLE "Document" ADD COLUMN "entityId" TEXT;

-- Add compliance/metadata columns
ALTER TABLE "Document" ADD COLUMN "expiresAt" TIMESTAMPTZ;
ALTER TABLE "Document" ADD COLUMN "metadata" JSONB;

-- Backfill from existing FK columns
UPDATE "Document" SET "entityType" = 'load', "entityId" = "loadId" WHERE "loadId" IS NOT NULL;
UPDATE "Document" SET "entityType" = 'carrier', "entityId" = "carrierId" WHERE "carrierId" IS NOT NULL;
-- Orphan safety net (both null)
UPDATE "Document" SET "entityType" = 'unknown', "entityId" = 'unknown' WHERE "entityType" IS NULL;

-- Make non-nullable
ALTER TABLE "Document" ALTER COLUMN "entityType" SET NOT NULL;
ALTER TABLE "Document" ALTER COLUMN "entityId" SET NOT NULL;

-- Drop old FK columns and indexes
DROP INDEX IF EXISTS "Document_loadId_idx";
DROP INDEX IF EXISTS "Document_carrierId_idx";
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_loadId_fkey";
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_carrierId_fkey";
ALTER TABLE "Document" DROP COLUMN "loadId";
ALTER TABLE "Document" DROP COLUMN "carrierId";

-- Add indexes
CREATE INDEX "Document_entityType_entityId_idx" ON "Document"("entityType", "entityId");
CREATE INDEX "Document_organizationId_type_idx" ON "Document"("organizationId", "type");
CREATE INDEX "Document_organizationId_expiresAt_idx" ON "Document"("organizationId", "expiresAt");
