-- Step 1: Add primaryContactId column
ALTER TABLE "Carrier" ADD COLUMN "primaryContactId" TEXT;

-- Step 2: Create Contact records from existing primaryContact flat fields
INSERT INTO "Contact" (id, "organizationId", "firstName", "lastName", phone, email, role, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  c."managedByOrgId",
  split_part(c."primaryContactName", ' ', 1),
  CASE
    WHEN position(' ' in coalesce(c."primaryContactName", '')) > 0
      THEN substring(c."primaryContactName" from position(' ' in c."primaryContactName") + 1)
    ELSE ''
  END,
  c."primaryContactPhone",
  c."primaryContactEmail",
  'primary_contact',
  NOW(),
  NOW()
FROM "Carrier" c
WHERE c."primaryContactName" IS NOT NULL
   OR c."primaryContactPhone" IS NOT NULL
   OR c."primaryContactEmail" IS NOT NULL;

-- Step 3: Link carriers to the newly created contacts
-- Match on org + role + name/email to avoid ambiguity
UPDATE "Carrier" c
SET "primaryContactId" = (
  SELECT ct.id
  FROM "Contact" ct
  WHERE ct."organizationId" = c."managedByOrgId"
    AND ct.role = 'primary_contact'
    AND (
      (c."primaryContactEmail" IS NOT NULL AND ct.email = c."primaryContactEmail")
      OR (c."primaryContactEmail" IS NULL AND ct."firstName" = split_part(c."primaryContactName", ' ', 1))
    )
  LIMIT 1
)
WHERE c."primaryContactName" IS NOT NULL
   OR c."primaryContactPhone" IS NOT NULL
   OR c."primaryContactEmail" IS NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE "Carrier" DROP COLUMN "primaryContactName";
ALTER TABLE "Carrier" DROP COLUMN "primaryContactPhone";
ALTER TABLE "Carrier" DROP COLUMN "primaryContactEmail";

-- Step 5: Add FK constraint
ALTER TABLE "Carrier" ADD CONSTRAINT "Carrier_primaryContactId_fkey"
  FOREIGN KEY ("primaryContactId") REFERENCES "Contact"(id)
  ON DELETE SET NULL ON UPDATE CASCADE;
