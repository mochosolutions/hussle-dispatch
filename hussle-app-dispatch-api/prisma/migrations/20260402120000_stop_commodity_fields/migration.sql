-- AlterTable: add commodity fields to Stop
ALTER TABLE "Stop" ADD COLUMN "commodity" TEXT;
ALTER TABLE "Stop" ADD COLUMN "weight" INTEGER;
ALTER TABLE "Stop" ADD COLUMN "pieceCount" INTEGER;
ALTER TABLE "Stop" ADD COLUMN "isHazmat" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Stop" ADD COLUMN "isTarp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Stop" ADD COLUMN "isTempControlled" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: copy load-level commodity data to each load's first PICKUP stop
UPDATE "Stop" s
SET
  "commodity"  = l."commodity",
  "weight"     = l."weight",
  "pieceCount" = l."pieceCount",
  "isHazmat"   = l."isHazmat",
  "isTarp"     = l."isTarp"
FROM "Load" l
WHERE s."loadId" = l."id"
  AND s."type" = 'PICKUP'
  AND s."sequence" = (
    SELECT MIN(s2."sequence")
    FROM "Stop" s2
    WHERE s2."loadId" = l."id"
      AND s2."type" = 'PICKUP'
  );
