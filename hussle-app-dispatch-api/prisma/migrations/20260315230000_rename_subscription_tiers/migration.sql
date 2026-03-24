-- AlterEnum: SubscriptionTier FREE/PRO/ENTERPRISE -> TRIAL/LAUNCH/PRO/ELITE
-- Strategy: create new type, migrate column, drop old type.
-- This avoids ADD VALUE which cannot be used in the same transaction.

-- 1. Create the new enum type
CREATE TYPE "SubscriptionTier_new" AS ENUM ('TRIAL', 'LAUNCH', 'PRO', 'ELITE');

-- 2. Migrate the column to the new type, mapping old values to new
ALTER TABLE "Organization"
  ALTER COLUMN "subscriptionTier" DROP DEFAULT;

ALTER TABLE "Organization"
  ALTER COLUMN "subscriptionTier" TYPE "SubscriptionTier_new"
  USING (
    CASE "subscriptionTier"::text
      WHEN 'FREE' THEN 'TRIAL'
      WHEN 'ENTERPRISE' THEN 'ELITE'
      ELSE "subscriptionTier"::text
    END
  )::"SubscriptionTier_new";

-- 3. Set the new default
ALTER TABLE "Organization"
  ALTER COLUMN "subscriptionTier" SET DEFAULT 'TRIAL'::"SubscriptionTier_new";

-- 4. Drop old type and rename new type
DROP TYPE "SubscriptionTier";
ALTER TYPE "SubscriptionTier_new" RENAME TO "SubscriptionTier";
