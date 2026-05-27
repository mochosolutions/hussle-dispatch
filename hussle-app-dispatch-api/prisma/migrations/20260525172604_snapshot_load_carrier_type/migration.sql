-- Add Load.carrierType snapshot column and backfill from Carrier (US-09b).
--
-- carrierType is consumed by totalRevenue math in calculateLoadFinancials.
-- US-09 snapshotted 9 rate inputs but left carrierType as a callsite "extras"
-- workaround — meaning a Carrier type reclassification retroactively changed
-- historical loads' totalRevenue. Snapshotting carrierType on Load closes that
-- gap. Nullable for safety; backfill populates all existing rows with a carrierId.

ALTER TABLE "Load" ADD COLUMN "carrierType" "CarrierType";

-- Backfill snapshots from Carrier (existing rows).
UPDATE "Load" l
SET "carrierType" = c."type"
FROM "Carrier" c
WHERE c."id" = l."carrierId" AND l."carrierId" IS NOT NULL;
