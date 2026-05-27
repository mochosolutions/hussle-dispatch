-- Schema Refactor: Load, Customer & Contact Simplification
-- - Contact simplified to person-only (remove company fields, ContactType enum)
-- - Load: remove brokerId/shipperId/consigneeId, add contactId, rename brokerRefNumber
-- - Customer: add carrierPacketSentAt, fix quickPayDiscount type

-- Step 1: Add new columns to Load
ALTER TABLE "Load" ADD COLUMN "contactId" TEXT;
ALTER TABLE "Load" ADD COLUMN "externalRefNumber" TEXT;

-- Step 2: Migrate data - copy brokerRefNumber to externalRefNumber
UPDATE "Load" SET "externalRefNumber" = "brokerRefNumber" WHERE "brokerRefNumber" IS NOT NULL;

-- Step 3: Copy brokerId to contactId (primary point of contact was typically the broker)
UPDATE "Load" SET "contactId" = "brokerId" WHERE "brokerId" IS NOT NULL;

-- Step 4: Drop old Load columns and their indexes
ALTER TABLE "Load" DROP COLUMN "brokerId";
ALTER TABLE "Load" DROP COLUMN "shipperId";
ALTER TABLE "Load" DROP COLUMN "consigneeId";
ALTER TABLE "Load" DROP COLUMN "brokerRefNumber";

-- Step 5: Add index on new contactId
CREATE INDEX "Load_contactId_idx" ON "Load"("contactId");

-- Step 6: Add FK constraint for Load.contactId
ALTER TABLE "Load" ADD CONSTRAINT "Load_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 7: Add carrierPacketSentAt to Customer
ALTER TABLE "Customer" ADD COLUMN "carrierPacketSentAt" TIMESTAMP(3);

-- Step 8: Migrate carrierPacketSentAt data from Contact to Customer
UPDATE "Customer" c
SET "carrierPacketSentAt" = ct."carrierPacketSentAt"
FROM "Contact" ct
WHERE ct."customerId" = c."id"
  AND ct."carrierPacketSentAt" IS NOT NULL
  AND c."carrierPacketSentAt" IS NULL;

-- Step 9: Fix Customer.quickPayDiscount type from Float to Decimal(5,2)
ALTER TABLE "Customer" ALTER COLUMN "quickPayDiscount" TYPE DECIMAL(5,2);

-- Step 10: Drop Contact company/billing fields
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "type";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "companyName";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "mcNumber";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "address";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "city";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "state";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "zip";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "paymentTerms";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "paymentTermsDays";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "quickPayDiscount";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "carrierPacketSentAt";

-- Step 11: Drop the ContactType enum
DROP TYPE IF EXISTS "ContactType";
