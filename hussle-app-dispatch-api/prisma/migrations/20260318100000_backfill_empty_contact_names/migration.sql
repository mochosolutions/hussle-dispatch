-- Backfill contacts with empty firstName AND lastName
-- Use email as lastName if available, otherwise phone, otherwise 'Unknown'
UPDATE "Contact"
SET "lastName" = CASE
      WHEN "email" IS NOT NULL AND "email" != '' THEN "email"
      WHEN "phone" IS NOT NULL AND "phone" != '' THEN "phone"
      ELSE 'Unknown'
    END
WHERE TRIM("firstName") = '' AND TRIM("lastName") = '';
