-- Split contactName into firstName + lastName on Contact table
-- Step 1: Add new columns as nullable first
ALTER TABLE "Contact" ADD COLUMN "firstName" TEXT;
ALTER TABLE "Contact" ADD COLUMN "lastName" TEXT;

-- Step 2: Migrate existing data (split contactName at first space, or use full value as lastName)
UPDATE "Contact"
SET "firstName" = CASE
      WHEN "contactName" IS NOT NULL AND POSITION(' ' IN "contactName") > 0
        THEN LEFT("contactName", POSITION(' ' IN "contactName") - 1)
      ELSE ''
    END,
    "lastName" = CASE
      WHEN "contactName" IS NOT NULL AND POSITION(' ' IN "contactName") > 0
        THEN SUBSTRING("contactName" FROM POSITION(' ' IN "contactName") + 1)
      WHEN "contactName" IS NOT NULL
        THEN "contactName"
      ELSE ''
    END;

-- Step 3: Make columns required
ALTER TABLE "Contact" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "Contact" ALTER COLUMN "lastName" SET NOT NULL;

-- Step 4: Drop old column
ALTER TABLE "Contact" DROP COLUMN "contactName";
