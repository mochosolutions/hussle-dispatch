-- AlterEnum: drop OWNER_OPERATOR from CarrierType
-- Strategy: migrate any existing rows to EXTERNAL_CARRIER (defensive — the API
-- has always rejected OWNER_OPERATOR at create time), then create a new enum
-- without OWNER_OPERATOR and swap. This pattern mirrors the subscription tier
-- rename migration (20260315230000_rename_subscription_tiers) and avoids
-- ADD VALUE restrictions in enum alters.

-- 1. Defensive data migration: move any OWNER_OPERATOR rows to EXTERNAL_CARRIER.
-- Per decision X-001 and the HIGH-11 audit finding, no production rows should
-- have this type, but we run this unconditionally to make the migration safe.
UPDATE "Carrier" SET "type" = 'EXTERNAL_CARRIER'
  WHERE "type" = 'OWNER_OPERATOR';

-- 2. Create the new enum type without OWNER_OPERATOR
CREATE TYPE "CarrierType_new" AS ENUM ('COMPANY_ASSET', 'LEASED_CARRIER', 'EXTERNAL_CARRIER');

-- 3. Drop the column default before the type swap — Postgres cannot auto-cast
--    a DEFAULT across enum types. We'll restore it after the ALTER COLUMN TYPE.
ALTER TABLE "Carrier" ALTER COLUMN "type" DROP DEFAULT;

-- 4. Migrate the Carrier.type column to the new enum
ALTER TABLE "Carrier"
  ALTER COLUMN "type" TYPE "CarrierType_new"
  USING "type"::text::"CarrierType_new";

-- 5. Drop the old enum and rename the new one
DROP TYPE "CarrierType";
ALTER TYPE "CarrierType_new" RENAME TO "CarrierType";

-- 6. Restore the column default (EXTERNAL_CARRIER is the schema default)
ALTER TABLE "Carrier" ALTER COLUMN "type" SET DEFAULT 'EXTERNAL_CARRIER'::"CarrierType";
