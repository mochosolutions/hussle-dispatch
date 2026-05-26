-- US-15: Drop 10 Load financial cache columns (compute-on-read via US-11).
-- AlterTable
ALTER TABLE "Load" DROP COLUMN "carrierPayout",
DROP COLUMN "companyMargin",
DROP COLUMN "dispatchFee",
DROP COLUMN "dispatcherComm",
DROP COLUMN "driverPay",
DROP COLUMN "estimatedCost",
DROP COLUMN "invoiceReadiness",
DROP COLUMN "partnerSplit",
DROP COLUMN "ratePerMile",
DROP COLUMN "ratePerTotalMile";
