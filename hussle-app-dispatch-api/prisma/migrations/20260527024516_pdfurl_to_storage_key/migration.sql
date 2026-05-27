-- Normalize Invoice.pdfUrl values that were previously stored as full HTTP URLs.
-- The column now holds the storage key only (e.g. `invoices/INV-2026-000001.pdf`).
-- URL resolution happens at request time inside GET /invoices/:id/pdf-download.
--
-- Matches local dev URLs shaped like:
--   http(s)://<host>:<port>/api/v1/storage/<key>
-- and strips the prefix to leave just the key. Rows already containing keys
-- (no scheme) are untouched.

UPDATE "Invoice"
SET "pdfUrl" = regexp_replace("pdfUrl", '^https?://[^/]+/api/v1/storage/', '')
WHERE "pdfUrl" ~ '^https?://[^/]+/api/v1/storage/';
