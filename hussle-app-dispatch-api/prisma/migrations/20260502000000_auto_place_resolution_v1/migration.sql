-- US-04: Auto Place Resolution — Phase 1 schema foundation
-- Adds:
--   - Place.unit, Place.source (+ AWS-canonical address columns)
--   - Stop.resolutionStatus
--   - Organization.headquartersLatitude/Longitude
--   - normalize_dedupe(text) Postgres function
--   - Unique expression index on Place dedupe key
--   - CHECK constraints for source / resolutionStatus enums
--   - Backfill for source + resolutionStatus

-- AlterTable: Organization
ALTER TABLE "Organization"
    ADD COLUMN "headquartersLatitude"  DECIMAL(9,6),
    ADD COLUMN "headquartersLongitude" DECIMAL(9,6);

-- AlterTable: Place
ALTER TABLE "Place"
    ADD COLUMN "unit"              TEXT,
    ADD COLUMN "source"            TEXT NOT NULL DEFAULT 'USER',
    ADD COLUMN "awsAddressNumber"  TEXT,
    ADD COLUMN "awsStreetBaseName" TEXT,
    ADD COLUMN "awsStreetType"     TEXT,
    ADD COLUMN "awsStreetPrefix"   TEXT,
    ADD COLUMN "awsRegion"         TEXT,
    ADD COLUMN "awsPostalCode5"    TEXT;

-- AlterTable: Stop
ALTER TABLE "Stop"
    ADD COLUMN "resolutionStatus" TEXT NOT NULL DEFAULT 'UNRESOLVED';

-- CreateIndex
CREATE INDEX "Place_organizationId_source_idx" ON "Place"("organizationId", "source");

-- CreateIndex
CREATE INDEX "Stop_resolutionStatus_idx" ON "Stop"("resolutionStatus");

-- CHECK constraints
ALTER TABLE "Place" ADD CONSTRAINT "Place_source_check"
    CHECK ("source" IN ('USER','AUTO'));
ALTER TABLE "Stop"  ADD CONSTRAINT "Stop_resolutionStatus_check"
    CHECK ("resolutionStatus" IN ('RESOLVED','UNRESOLVED','AMBIGUOUS'));

-- Postgres function: shared normalization for dedupe key.
-- Semantics: case-fold, edge-trim, collapse internal whitespace.
-- IMPORTANT: must stay in lock-step with the application-side normalize() helper
-- (see US-05 / src/places/utils/normalize.ts). Parity is asserted by
-- normalizeDedupeParity.test.ts.
CREATE OR REPLACE FUNCTION normalize_dedupe(text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(regexp_replace(trim($1), '\s+', ' ', 'g'))
$$;

-- Unique expression index on Place dedupe key.
-- Uses Place.name as the canonical facility-name column (Place has no
-- separate facilityName field).
CREATE UNIQUE INDEX "Place_dedupeKey_uniq" ON "Place" (
    "organizationId",
    normalize_dedupe("name"),
    "awsAddressNumber",
    normalize_dedupe("awsStreetBaseName"),
    "awsStreetType",
    "awsStreetPrefix",
    COALESCE(normalize_dedupe("unit"), ''),
    "awsRegion",
    "awsPostalCode5"
);

-- Backfill
UPDATE "Place" SET "source" = 'USER' WHERE "source" IS NULL;
UPDATE "Stop"
   SET "resolutionStatus" = CASE WHEN "placeId" IS NOT NULL THEN 'RESOLVED' ELSE 'UNRESOLVED' END;
