-- Consolidate Carrier.status + Carrier.onboardingStatus into a single CarrierStatus enum.
-- Mapping (status, onboardingStatus) -> new status:
--   (*, REJECTED)               -> REJECTED
--   (SUSPENDED, *)              -> SUSPENDED
--   (ACTIVE, APPROVED)          -> ACTIVE
--   (ACTIVE, _) [bug rows]      -> ACTIVE   (grandfathered)
--   (PENDING, COMPLETED)        -> PENDING_APPROVAL
--   (PENDING, IN_PROGRESS)      -> ONBOARDING
--   (PENDING, NOT_STARTED)      -> INVITED
--   (DRAFT, *)                  -> DRAFT

-- 1. Rename old enum out of the way.
ALTER TYPE "CarrierStatus" RENAME TO "CarrierStatus_old";

-- 2. Create the new consolidated enum.
CREATE TYPE "CarrierStatus" AS ENUM (
  'DRAFT',
  'INVITED',
  'ONBOARDING',
  'PENDING_APPROVAL',
  'REJECTED',
  'ACTIVE',
  'ACTION_REQUIRED',
  'SUSPENDED'
);

-- 3. Drop the old default before changing the column type (Postgres can't auto-cast the default).
ALTER TABLE "Carrier" ALTER COLUMN "status" DROP DEFAULT;

-- 4. Migrate the column to the new enum, mapping each row from the (old status, onboardingStatus) pair.
ALTER TABLE "Carrier"
  ALTER COLUMN "status" TYPE "CarrierStatus" USING (
    CASE
      WHEN "onboardingStatus" = 'REJECTED' THEN 'REJECTED'
      WHEN "status" = 'SUSPENDED' THEN 'SUSPENDED'
      WHEN "status" = 'ACTIVE' THEN 'ACTIVE'
      WHEN "status" = 'PENDING' AND "onboardingStatus" = 'COMPLETED' THEN 'PENDING_APPROVAL'
      WHEN "status" = 'PENDING' AND "onboardingStatus" = 'IN_PROGRESS' THEN 'ONBOARDING'
      WHEN "status" = 'PENDING' AND "onboardingStatus" = 'NOT_STARTED' THEN 'INVITED'
      ELSE 'DRAFT'
    END
  )::"CarrierStatus";

-- 5. Set the new default.
ALTER TABLE "Carrier" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- 6. Drop the now-redundant onboardingStatus column.
ALTER TABLE "Carrier" DROP COLUMN "onboardingStatus";

-- 7. Drop the legacy enums.
DROP TYPE "CarrierStatus_old";
DROP TYPE "OnboardingStatus";
