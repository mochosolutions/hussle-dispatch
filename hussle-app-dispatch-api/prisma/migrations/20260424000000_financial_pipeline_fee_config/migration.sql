-- CreateEnum
CREATE TYPE "DispatchFeeType" AS ENUM ('PERCENTAGE', 'FLAT');

-- AlterEnum
ALTER TYPE "SettlementItemType" ADD VALUE 'DRIVER_PAY';

-- AlterTable: Carrier
ALTER TABLE "Carrier"
  ADD COLUMN "dispatchFeeType" "DispatchFeeType" NOT NULL DEFAULT 'PERCENTAGE',
  ADD COLUMN "dispatchFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ALTER COLUMN "feeIncludesAccessorials" SET DEFAULT true;

-- AlterTable: Load
ALTER TABLE "Load"
  ADD COLUMN "dispatchFeeOverrideType" "DispatchFeeType",
  ADD COLUMN "dispatchFeeOverrideAmount" DECIMAL(10,2);
