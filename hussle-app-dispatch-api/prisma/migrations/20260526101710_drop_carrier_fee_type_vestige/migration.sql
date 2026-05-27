-- Cleanup: drop vestigial Carrier.feeType column and FeeType enum.
-- The column was never read by any business logic; DispatchFeeType drives
-- dispatch-fee resolution (resolveDispatchFee.ts). FeeType had no other
-- consumers, so the enum is dropped too.

-- AlterTable
ALTER TABLE "Carrier" DROP COLUMN "feeType";

-- DropEnum
DROP TYPE "FeeType";
