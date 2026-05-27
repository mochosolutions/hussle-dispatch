-- Add 7 new Load rate-input snapshot columns, rename 2 override columns,
-- and backfill from Carrier / Driver / DispatcherProfile (US-09).
--
-- Rename preserves any existing per-load override data already captured.

-- Rename existing override columns to their generalized snapshot names.
ALTER TABLE "Load" RENAME COLUMN "dispatchFeeOverrideType" TO "dispatchFeeType";
ALTER TABLE "Load" RENAME COLUMN "dispatchFeeOverrideAmount" TO "dispatchFeeAmount";

-- Add 7 new snapshot columns (all nullable; backfill below populates them).
ALTER TABLE "Load"
  ADD COLUMN "partnerSplitPercent"       DECIMAL(7,4),
  ADD COLUMN "driverPayType"             "DriverPayType",
  ADD COLUMN "driverPayRate"             DECIMAL(7,4),
  ADD COLUMN "dispatcherCommissionType"  "DispatcherCommType",
  ADD COLUMN "dispatcherCommissionRate"  DECIMAL(7,4),
  ADD COLUMN "feeIncludesAccessorials"   BOOLEAN,
  ADD COLUMN "payFromNet"                BOOLEAN;

-- Backfill Carrier-sourced snapshots for all loads with a carrier assigned.
-- dispatchFeeType / dispatchFeeAmount: only backfill when NULL (preserve existing per-load override).
-- dispatchFeeAmount stores carrier.dispatchFeePercent when type=PERCENTAGE, carrier.dispatchFeeAmount when FLAT.
UPDATE "Load" l
SET
  "partnerSplitPercent"     = c."partnerSplitPercent",
  "feeIncludesAccessorials" = c."feeIncludesAccessorials",
  "payFromNet"              = c."payFromNet",
  "dispatchFeeType"         = COALESCE(l."dispatchFeeType", c."dispatchFeeType"),
  "dispatchFeeAmount"       = COALESCE(
    l."dispatchFeeAmount",
    CASE
      WHEN c."dispatchFeeType" = 'PERCENTAGE' THEN c."dispatchFeePercent"
      ELSE c."dispatchFeeAmount"
    END
  )
FROM "Carrier" c
WHERE l."carrierId" = c."id";

-- Backfill Driver-sourced snapshots for all loads with a driver assigned.
UPDATE "Load" l
SET
  "driverPayType" = d."payType",
  "driverPayRate" = d."payRate"
FROM "Driver" d
WHERE l."driverId" = d."id";

-- Backfill DispatcherProfile-sourced snapshots for all loads with a dispatcher
-- whose user has a DispatcherProfile in the load's organization (2-table join via Membership).
UPDATE "Load" l
SET
  "dispatcherCommissionType" = dp."commissionType",
  "dispatcherCommissionRate" = dp."commissionRate"
FROM "Membership" m
JOIN "DispatcherProfile" dp ON dp."membershipId" = m."id"
WHERE m."userId" = l."dispatcherUserId"
  AND m."organizationId" = l."organizationId"
  AND l."dispatcherUserId" IS NOT NULL;
