-- Standardize all percentage fields to Decimal(7,4) at 0-100 convention.
-- Decimal(7,4) supports up to 999.9999 — enough for sub-basis-point precision
-- needed for future financial products (loan rates, origination fees).

-- Carrier: widen existing 0-100 fields from Decimal(5,2) to Decimal(7,4)
ALTER TABLE "Carrier" ALTER COLUMN "dispatchFeePercent" TYPE DECIMAL(7,4);
ALTER TABLE "Carrier" ALTER COLUMN "dispatchFeePercent" SET DEFAULT 10.0000;
ALTER TABLE "Carrier" ALTER COLUMN "partnerSplitPercent" TYPE DECIMAL(7,4);
ALTER TABLE "Carrier" ALTER COLUMN "partnerSplitPercent" SET DEFAULT 50.0000;
ALTER TABLE "Carrier" ALTER COLUMN "ownerOpPayPercent" TYPE DECIMAL(7,4);

-- Carrier: convert factoringAdvanceRate from 0-1 to 0-100 AND widen
UPDATE "Carrier" SET "factoringAdvanceRate" = "factoringAdvanceRate" * 100
  WHERE "factoringAdvanceRate" IS NOT NULL;
ALTER TABLE "Carrier" ALTER COLUMN "factoringAdvanceRate" TYPE DECIMAL(7,4);

-- Carrier: convert factoringFeePercent from 0-1 to 0-100 AND widen
UPDATE "Carrier" SET "factoringFeePercent" = "factoringFeePercent" * 100
  WHERE "factoringFeePercent" IS NOT NULL;
ALTER TABLE "Carrier" ALTER COLUMN "factoringFeePercent" TYPE DECIMAL(7,4);

-- OrgSettings: convert minBookRateProfitMargin from 0-1 to 0-100 AND widen
UPDATE "OrgSettings" SET "minBookRateProfitMargin" = "minBookRateProfitMargin" * 100;
ALTER TABLE "OrgSettings" ALTER COLUMN "minBookRateProfitMargin" TYPE DECIMAL(7,4);
ALTER TABLE "OrgSettings" ALTER COLUMN "minBookRateProfitMargin" SET DEFAULT 15.0000;

-- Customer: widen quickPayDiscount from Decimal(5,2) to Decimal(7,4)
ALTER TABLE "Customer" ALTER COLUMN "quickPayDiscount" TYPE DECIMAL(7,4);
