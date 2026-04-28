-- Add foreign key for Document.uploadedByUserId -> User.id
-- and an index for the new lookup path.

CREATE INDEX IF NOT EXISTS "Document_uploadedByUserId_idx"
  ON "Document"("uploadedByUserId");

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_uploadedByUserId_fkey"
  FOREIGN KEY ("uploadedByUserId")
  REFERENCES "User"(id)
  ON UPDATE CASCADE
  ON DELETE SET NULL;
