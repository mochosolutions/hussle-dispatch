# Database Review

**Reviewed:** 2026-04-22
**Scope:** `hussle-app-dispatch-api/prisma/schema.prisma` (1,429 lines, 38 models, 47 enums) · last 10 migrations (20260405 → 20260422) · 6 repositories spot-checked (`loadRepositoryPrisma`, `carrierRepositoryPrisma`, `driverRepositoryPrisma`, `invoiceRepositoryPrisma`, `expenseRepositoryPrisma`, `settlementRepositoryPrisma`, `auditLogRepositoryPrisma`, `notificationLogRepositoryPrisma`)
**Verdict:** SHIP_WITH_FIXES

## Executive Summary

The schema is in materially good shape for an MVP staging demo: tenant scoping via `organizationId` is consistently applied on direct-owned root models, money uses `Decimal(10,2)` throughout, the state-machine and settlement additions (`version`, `snapshotHash`) land correctly, and the `OWNER_OPERATOR` enum removal follows the safe "create new type + swap" pattern. The biggest structural risk is a **tenant-leak in the notification history endpoint** (`GET /notifications/loads/:loadId/history`) which fetches logs by `loadId` with no org check — any authenticated user can read any org's load notification history. Secondary risks are an **unbounded `invoice.findAll`** with no `take` limit, several **missing FK indexes** on hot query columns (Load.driverId/vehicleId, Invoice.carrierId, Settlement.driverId, SettlementLineItem.settlementId), and a **missing AuditLog composite index** on `entityType, entityId`. Most other items are polish (enum-candidate strings, missing unique constraints on MC/VIN, inconsistent soft-delete pattern).

Five trivial `@@index` additions were applied to the schema (see Trivial Fixes Applied). These need a migration.

## Critical — Fix Before Production

### CRIT-01: Notification history endpoint has no tenant scoping (tenant leak)

- **File/Model:** `src/notifications/controllers/loadNotificationController.ts:129-133` + `src/notifications/routes/notificationRoutes.ts:83-88` + `src/notifications/repositories/notificationLogRepositoryPrisma.ts:26-30`
- **Issue:** `GET /notifications/loads/:loadId/history` calls `deps.logRepo.findByLoadId(loadId)` which queries `NotificationLog` with `{ where: { loadId } }` only. The route is gated by `requireAuth` but never checks that the load belongs to the caller's org. Any authenticated user, from any organization, can enumerate notification history for arbitrary `loadId` values (UUIDs are guessable via other endpoints/timestamps). This is a lateral tenant-access bug.
- **Evidence:** `findByLoadId: async (loadId) => prisma.notificationLog.findMany({ where: { loadId }, ... })` — no `organizationId`, no join through `load: { organizationId }`.
- **Fix:** Two options. (1) Add `organizationId` parameter to `findByLoadId(loadId, organizationId)` and scope via `load: { organizationId }` (mirrors `invoiceRepositoryPrisma` pattern). (2) Pre-validate loadId ownership in the service layer by loading the Load scoped to org before calling the log repo. Option 1 is more defensive. Also add equivalent scoping audit to `loadNotificationOverrideRepositoryPrisma.findByLoadId`.
- **Effort:** S

### CRIT-02: `invoice.findAll` returns unbounded rows

- **File/Model:** `src/invoices/repositories/invoiceRepositoryPrisma.ts:143-148`
- **Issue:** `findAll(organizationId, filters)` has no `take` limit and no pagination. Once invoices reach thousands per org, this will pull the full result set into memory on every list request — memory pressure and slow responses are near-certain in production. Worse, this select brings relations (load/carrier/customer truncated selects) scaled by row count.
- **Evidence:** `prisma.invoice.findMany({ where: ..., select: INVOICE_LIST_SELECT, orderBy: { createdAt: 'desc' } })` — no `take`, no `skip`.
- **Fix:** Add `page/limit` to `InvoiceListFilters`, enforce a server-side cap (e.g., default 50, max 200), return `{ data, meta }` envelope consistent with `expenseRepositoryPrisma`. Add an Invoice total-count method for pagination.
- **Effort:** S

### CRIT-03: `NotificationLog → Load` cascade deletes audit history

- **File/Model:** `prisma/schema.prisma:1138` (`NotificationLog.load` relation)
- **Issue:** `NotificationLog` is a historical audit trail of outbound customer/driver communications (status changes, document uploads). It has `onDelete: Cascade` from Load. If a Load is ever hard-deleted (admin cleanup, GDPR right-to-erasure, accidental unguarded delete), the entire outbound communication record vanishes too. The same applies to `CheckCall`, `LoadStatusHistory`, `AccessorialCharge`, and `Invoice` where they carry regulatory/financial meaning. Invoice today has no `onDelete` (falls back to NoAction, which is actually safer).
- **Evidence:** Schema lines 808 (Stop), 867 (LoadStatusHistory), 886 (CheckCall), 907 (AccessorialCharge), 1096 (LoadNotificationOverride), 1118 (LoadTrackingToken), 1138 (NotificationLog), 1420 (SmsPromptSchedule) all `onDelete: Cascade`. Load uses `deletedAt` soft-delete in practice, so cascades rarely fire — but the constraint should match intent.
- **Fix:** Change `NotificationLog`, `LoadStatusHistory`, and `CheckCall` to `onDelete: Restrict`. Keep `Cascade` on `Stop`, `AccessorialCharge`, `LoadNotificationOverride`, `LoadTrackingToken`, `SmsPromptSchedule` — those are non-historical child rows safe to delete with the parent. This is a schema change that requires a migration (not trivial auto-fix).
- **Effort:** S

### CRIT-04: `Invoice.invoiceNumber` is globally unique rather than per-org

- **File/Model:** `prisma/schema.prisma:920`
- **Issue:** `invoiceNumber String @unique` enforces uniqueness across the entire database, not per organization. Two different orgs that independently issue invoice "INV-001" will collide at the second create. This breaks multi-tenant invoice numbering isolation. Additionally, `Settlement.settlementNumber` has no unique constraint at all (line 1288) — orgs can produce duplicate settlement numbers silently.
- **Evidence:** Schema line 920 `invoiceNumber String @unique` (no per-org scoping). Schema line 1288 `settlementNumber String` (no unique anywhere).
- **Fix:** Replace `@unique` on `invoiceNumber` with `@@unique([organizationId, invoiceNumber])` — but note Invoice does not currently carry `organizationId` (scopes via Load). Either (a) denormalize `organizationId` onto Invoice and add the composite unique, or (b) use `@@unique([loadId, invoiceNumber])` if numbering is per-load (unlikely). (a) is aligned with how Expense/Settlement already carry `organizationId` directly. Similarly add `@@unique([organizationId, settlementNumber])` to Settlement.
- **Effort:** M (requires backfill + code adjustment in invoice service)

## High — Fix Soon

### HIGH-01: Missing indexes on hot FK query columns — 5 added as trivial fixes

- **File/Model:** `prisma/schema.prisma` (Load, Invoice, Settlement, SettlementLineItem, AuditLog)
- **Issue:** Several FK columns that are filtered on in repo queries had no index. Prisma does NOT auto-create indexes on FK columns — only on `@id` and `@unique`. This causes full-table scans on medium tables as data grows.
- **Evidence:** 54 code references to `driverId:` filters in `src/loads`; `carrierId` filtering appears in invoice list queries (see `invoiceRepositoryPrisma.ts`); settlements commonly filter by driver; `settlementLineItem` fetched by `settlementId` in `recalculateTotals`; `auditLog.findByEntity` queries `entityType + entityId`.
- **Fix:** Applied 5 trivial `@@index` additions (see Trivial Fixes Applied). A migration must be generated.
- **Effort:** XS (schema done; needs `prisma migrate dev --create-only --name add_missing_fk_indexes` to emit the SQL)

### HIGH-02: Remaining unindexed FK / filter columns

- **File/Model:** `prisma/schema.prisma`
- **Issue:** Beyond the 5 fixed, additional FK columns are unindexed and used in joins or filters:
  - `Load.dispatcherUserId`, `createdByUserId`, `updatedByUserId` — per-user audit lookups
  - `Invoice.createdByUserId`, `approvedByUserId` — per-user approval dashboards
  - `Settlement.approvedByUserId`, `vehicleId` — filters in settlement reports
  - `LoadTrackingToken.driverId` (loadId and vehicleId indexed; driverId is not)
  - `SmsPromptSchedule.driverId`
  - `Expense.driverId`, `recurringExpenseId`
  - `Loan.organizationId`, `vehicleId`
  - `LoanPayment.loanId`, `expenseId`
  - `RecurringExpense.organizationId`, `loanId` (`vehicleId` covered by composite unique)
  - `Membership.invitedById`, `Invitation.invitedById`
  - `LoadStatusHistory.changedByUserId`, `CheckCall.calledByUserId`
- **Fix:** Audit each against actual query patterns. Add `@@index` where the column appears in any `where`, `orderBy`, or join predicate. Group them into one migration `add_secondary_fk_indexes`.
- **Effort:** S

### HIGH-03: `NotificationLog` table will grow unbounded, no retention/partition plan

- **File/Model:** `prisma/schema.prisma:1125-1142`
- **Issue:** `NotificationLog` records one row per outbound SMS/email per load event. With typical dispatch volume (10-50 loads/day/org × ~5 events/load × N orgs × emails + SMS), this table will accumulate hundreds of thousands of rows per month. There's no retention policy, no partition by `createdAt`, no archive path. Same concern applies to `LoadStatusHistory`, `CheckCall`, `AuditLog`, and `SmsPromptSchedule`.
- **Evidence:** No `deletedAt`, no TTL, no periodic cleanup script found via repo search.
- **Fix:** Pre-production: add monthly partition on `createdAt` (requires raw SQL — Prisma doesn't express partitions). Short-term mitigation: add a scheduled job that archives rows older than 90 days (configurable) to cold storage or deletes. At minimum, add `@@index([createdAt])` on these tables so date-range cleanup queries are fast.
- **Effort:** M (partitioning) / S (retention job)

### HIGH-04: AuditLog lacks FK constraints on `userId` and `organizationId`

- **File/Model:** `prisma/schema.prisma:120-134`
- **Issue:** `AuditLog.userId` and `AuditLog.organizationId` are plain `String` columns without `@relation` declarations, so there are no FK constraints at the DB level. This was likely intentional (audit records should survive user/org deletion) but it means orphaned references can accumulate and joins in reporting queries will not use FK indexes. The `@@index([userId])` helps but doesn't substitute for referential integrity.
- **Evidence:** Lines 122-123 are `String?` / `String` columns; no `user User?  @relation(...)` declaration in the model.
- **Fix:** Intentionally leave as-is (audit logs should not cascade-delete with users), but document this in a schema comment so future devs don't "fix" it. Also consider `onDelete: SetNull` FKs with `userId String?` to get soft referential integrity.
- **Effort:** XS (documentation)

### HIGH-05: Stop model carries denormalized facility/commodity fields duplicated on Place

- **File/Model:** `prisma/schema.prisma:774-815`
- **Issue:** `Stop` has `facilityName, address, city, state, zip` *and* a `placeId` FK to `Place` which carries the same fields. The denormalization accommodates "ad-hoc" stops without a saved Place, but it means address updates on Place don't propagate and queries have to coalesce. Similarly, `contactName, contactPhone` on Stop duplicates data available through the Contact relation.
- **Evidence:** Stop lines 781-785 (address fields) vs Place lines 822-827 (same fields).
- **Fix:** Not a production blocker, but documented debt. Consider in a future cleanup: require `placeId` on all Stops and drop the denormalized columns, or formalize "snapshot" semantics (Stop fields are historical, Place fields are current). Pick one intent and remove the ambiguity.
- **Effort:** L

### HIGH-06: Yup validators don't reject unknown keys (silent drop)

- **File/Model:** Noted in scope docs. Pre-existing concern. Flagging as HIGH because it intersects with schema correctness: if a client sends an unknown field (e.g., typo'd column name or an attempt to update a protected column), Yup silently drops it, and the update silently "succeeds" with no change. Combined with the mapper-based dispatch style, this is a data-integrity risk: bugs are silent until QA spots drift.
- **Fix:** Add `.noUnknown(true)` + `.strict(true)` globally in a shared schema helper. Tests should assert unknown key → 400.
- **Effort:** S (code-level, not schema)

### HIGH-07: Missing unique constraints on business identifiers

- **File/Model:** `prisma/schema.prisma` (Carrier, Customer, Vehicle)
- **Issue:** Carrier.mcNumber, Customer.mcNumber, Vehicle.vin, Vehicle.licensePlate have no unique constraint, not even per-org. A dispatcher can accidentally create two Carrier rows for MC 123456 within the same org. Duplicates propagate into load creation, settlements, and reports.
- **Fix:** Add `@@unique([managedByOrgId, mcNumber])` on Carrier (allow null via `mcNumber String?`), `@@unique([organizationId, mcNumber])` on Customer, `@@unique([carrierId, vin])` and `@@unique([carrierId, licensePlate])` on Vehicle. Postgres `UNIQUE` treats NULLs as distinct, so nullable MC/VIN columns stay permissive.
- **Effort:** S (needs migration with de-dup data migration step)

### HIGH-08: String columns that should be enums

- **File/Model:** `prisma/schema.prisma`
- **Issue:** Several columns are `String` with implicit enumerated values hard-coded in code:
  - `AccessorialCharge.billTo` (line 898): `"customer"` / `"carrier"` (known casing drift with UI)
  - `Carrier.authorityStatus` (line 551): `"active"` / `"inactive"` / probably others
  - `Document.uploadStatus` (line 971): `"pending"` / `"complete"` / `"failed"` pattern
  - `Document.reviewStatus` (line 977): `"pending_review"` / `"approved"` / `"rejected"`
  - `Invoice.paymentTerms` (line 925): `"net_30"` style
  - `Invoice.paymentMethod`, `deliveryMethod` — similar
  - `Place.status` (line 844): `"active"` — likely has `"inactive"` too
  - `Settlement.paymentMethod`, `CheckCall.status`, `NotificationLog.status` — same pattern
- **Fix:** Promote each to a proper enum when the code churn is acceptable. Highest value: `billTo` (known drift bug), `reviewStatus`, `uploadStatus`, `paymentTerms`.
- **Effort:** M (each enum conversion is 1 migration + code fan-out)

### HIGH-09: Inconsistent soft-delete pattern across models

- **File/Model:** `prisma/schema.prisma`
- **Issue:** Some models use `deleted Boolean + deletedAt DateTime?` (Organization, Membership, Customer). Others only have `deletedAt DateTime?` (Carrier, Contact, Driver, Vehicle, Load, Place, Expense). `Invoice`, `Settlement`, `LoanPayment`, `NotificationLog`, `CheckCall`, `LoadStatusHistory`, `Stop`, `TruckExpense`, `AccessorialCharge`, `SettlementLineItem` have no soft-delete at all. This pattern is inconsistent and forces every repo to guess which pattern applies.
- **Evidence:** See schema search for `deletedAt` vs `deleted`.
- **Fix:** Standardize. Recommendation: drop the redundant `deleted Boolean` (derivable from `deletedAt !== null`) on Organization/Membership/Customer. Document which models are soft-deleted vs hard (financial/audit rows shouldn't soft-delete). Add partial unique indexes (`WHERE "deletedAt" IS NULL`) on business keys that would otherwise collide after delete-and-recreate — this requires raw SQL in the migration.
- **Effort:** M

### HIGH-10: `Expense.category` String[] not normalized; `Organization.customFields` / `resources` are arbitrary Json

- **File/Model:** `prisma/schema.prisma:34, 35, 550, 676`
- **Issue:** Arrays/Jsons like `Carrier.fuelCardProviders String[]`, `Vehicle.deliveryTypes String[]`, `Organization.customFields Json?`, `Organization.resources Json?`, `Driver.endorsements/preferredLanes/noGoZones Json?`, `Place.facilityHours Json?` are not typed. If the frontend ever queries "find drivers with endorsement X" or "filter carriers by fuel card", Postgres will do a full-table scan unless a GIN index is added. These fields are fine for read-by-id but will not scale if filtered.
- **Fix:** For now, document that these are write-only display metadata. If a feature needs to filter on them, either (a) add a GIN index via raw SQL, or (b) normalize into a child table. Do NOT let Json querying leak into hot paths.
- **Effort:** Document now; revisit when a feature needs it.

## Medium — Improve Incrementally

### MED-01: Settlement repo throws generic `Error`

- **File:** `src/settlements/repositories/settlementRepositoryPrisma.ts:114`
- `throw new Error('Settlement ${id} not found after update')` violates the project's typed-error rule. Use `NotFoundError` or `ConflictError`.

### MED-02: SettlementLineItem mutations bypass tenant scope at repo layer

- **File:** `src/settlements/repositories/settlementRepositoryPrisma.ts:120-131`
- `addLineItem`, `updateLineItem`, `deleteLineItem` take only the line item ID. They rely on the service layer to verify settlement ownership via `findById(settlementId, organizationId)` before calling. This works today (verified in `settlementAdjustmentService.ts`), but it's a trust-contract that a future dev could break without any test catching it. Add defensive `settlement: { organizationId }` scoping in the repo methods, or accept an `organizationId` parameter.

### MED-03: Carrier.type default vs business rule

- **File:** `prisma/schema.prisma:517`
- `type CarrierType @default(EXTERNAL_CARRIER)` is reasonable but note that invite-flow carriers and company-asset carriers are created with explicit types. The default mostly matters for imports/scripts. Fine as-is.

### MED-04: `Stop` has string time fields for `callByTime` (line 803) and `DriverAvailability.startTime`/`endTime` (lines 1187-1188)

- Storing time-of-day as `String` (presumably "HH:mm") is common but silent-fail prone. Consider PostgreSQL `TIME` type or validation regex. If the strings ever get compared or sorted lexicographically, "9:00" < "10:00" alphabetically fails.

### MED-05: `Driver.availableHours Decimal(4,1)` — hours-of-service

- This is a coarse snapshot, not the full HOS log. Flag for future normalization into a time-series table when HOS enforcement lands. Not a blocker now.

### MED-06: `OrgSettings.prohibitedCommodities String[]` default is lowercase strings

- Line 997 default: `["garbage", "refuse", "recyclables", "dirty recyclables"]`. No case-insensitive index or normalization; matching logic must lowercase in code. Document or add a citext or normalized view. Low severity.

### MED-07: Migration `20260414000000_add_stop_scheduling_fields` has empty SQL file

- Known drift (comment says DB was migrated out-of-band). Acceptable given the comment, but note that anyone bringing up a fresh DB from scratch will be missing whatever that migration did. Risk: staging or production re-provision reveals drift. Recommend reconstructing the SQL from schema history (git blame on schema.prisma around that date).

### MED-08: `LoadNotificationOverride.findByLoadId` is unscoped (same pattern as CRIT-01)

- `src/notifications/repositories/loadNotificationOverrideRepositoryPrisma.ts:8` — same unscoped-by-loadId pattern. Only not CRIT because it's used from services that already pre-validate the load (spot-checked `bulkUpsert` flow). Still, the repo should be defensive.

## Low / Nits

- LOW-01: `Load.plannedNextLoadRef Json?` (line 743) — one-off arbitrary JSON with no schema. Document the shape or normalize.
- LOW-02: `Organization.role OrganizationRole @default(CARRIER)` (line 29) — "role" is an overloaded term (organization role vs membership role). Consider renaming to `organizationRole` or `type`.
- LOW-03: `Carrier.entryMethod String? @default("INVITE")` (line 544) — enum candidate. Values likely: INVITE, MANUAL, IMPORT.
- LOW-04: `Driver.licenseState String?` (line 615) — should be `@db.Char(2)` for US state codes.
- LOW-05: `Expense.state String?` (line 1237) — same (IFTA state code, always 2 chars).
- LOW-06: `Vehicle.vin String?` (line 659) — VINs are exactly 17 characters. Add `@db.VarChar(17)` and an application-level check-digit validator.
- LOW-07: `LoadStateMiles.state @db.Char(2)` (line 1340) is done correctly — use as pattern for other state columns.
- LOW-08: Schema has `partnerSplit`/`partnerSplitPercent` fields — scope doc flags as "possibly dead" but grep shows active use in 23 source files. Not dead; the scope note is stale.
- LOW-09: `Settlement.totalMiles` is `Int` but `LoadStateMiles.miles` is `Decimal(8,2)`. Potential rounding drift when summing state miles into settlement total.

## Strengths

- Tenant scoping is present and consistent on every root domain model (`Carrier` via `managedByOrgId`, `Contact/Load/Place/Customer/Expense/RecurringExpense/Settlement/Loan/SmsPromptSchedule/Document` all carry `organizationId` directly).
- Money columns are universally `Decimal(10,2)` with appropriate precision bumps (`Decimal(12,2)` for `Settlement.grossRevenue`, `Loan.originalAmount`); no `Float` for currency.
- Optimistic locking (`Load.version`, `Membership.permissionsVersion`) already landed for high-contention records.
- Settlement snapshot hash (`Settlement.snapshotHash`) provides a tamper-evident trail for financial freezing.
- Enum removal (`OWNER_OPERATOR`) used the create-new-type + swap pattern correctly with a defensive data migration UPDATE — exemplary migration practice.
- Composite indexes on common access patterns: `([organizationId, loadNumber])` unique, `([organizationId, date])` on Expense, `([organizationId, periodStart])` on Settlement, `([loadId, trigger])` on NotificationLog — show thoughtful index design for the dominant queries.
- Audit log model is minimal, typed, and consistently scoped by organizationId in the repo.
- Cascade rules on load child entities (Stop, AccessorialCharge, LoadTrackingToken, SmsPromptSchedule, LoadNotificationOverride) are correctly Cascade.
- SmsPromptSchedule (newly added) correctly includes organizationId, indexes, explicit FK onDelete rules, and Cascade-on-load semantics.

## Patterns Observed

- **Repo scoping style varies:** Expense / Settlement / Load scope directly on `organizationId` (owned column). Invoice / NotificationLog / Stop scope indirectly via `load: { organizationId }` (join-based). Both work, but the indirect pattern is weaker against future refactors — any breaking change to Load scoping silently breaks downstream. Consider denormalizing `organizationId` onto Invoice in particular (aligns with the per-org unique constraint fix in CRIT-04).
- **Soft-delete is inconsistent** across 6+ models — see HIGH-09. Needs a unified decision.
- **Cascade vs Restrict is not thoughtfully chosen** per relation — most relations default to NoAction implicitly. Since Load is never hard-deleted in practice, this is latent.
- **Generic `Error` throws** appear in at least one repo (Settlement). Project rule is typed errors.
- **Enum candidates stored as String** — at least 8 columns (see HIGH-08). Pick low-churn ones (`billTo`, `reviewStatus`, `uploadStatus`) first.

## Trivial Fixes Applied

Applied 5 `@@index` additions to `prisma/schema.prisma`. Each is additive, no data migration. **A migration still needs to be generated** — these schema edits will not ship until someone runs `npx prisma migrate dev --create-only --name add_missing_fk_indexes` and reviews the generated SQL.

```sql
-- Expected migration SQL (reference — generate via prisma migrate):
CREATE INDEX "Load_driverId_idx" ON "Load"("driverId");
CREATE INDEX "Load_vehicleId_idx" ON "Load"("vehicleId");
CREATE INDEX "Invoice_carrierId_idx" ON "Invoice"("carrierId");
CREATE INDEX "Settlement_driverId_idx" ON "Settlement"("driverId");
CREATE INDEX "SettlementLineItem_settlementId_idx" ON "SettlementLineItem"("settlementId");
CREATE INDEX "AuditLog_organizationId_entityType_entityId_idx"
  ON "AuditLog"("organizationId", "entityType", "entityId");
```

(That's 6 indexes but 5 schema-level `@@index` directives — the `AuditLog` composite replaces the need for a separate `entityType, entityId` index I'd otherwise recommend.)

`npx prisma validate` passed after the edits.

## Stats

- Models reviewed: 38
- Enums reviewed: 47
- Indexes audited: 56 existing + 5 added
- Repositories spot-checked: 8 (`loadRepositoryPrisma`, `carrierRepositoryPrisma`, `driverRepositoryPrisma`, `invoiceRepositoryPrisma`, `expenseRepositoryPrisma`, `settlementRepositoryPrisma`, `auditLogRepositoryPrisma`, `notificationLogRepositoryPrisma`)
- Migrations reviewed: 10 (`20260405160000` → `20260422000000`)
- Raw SQL usage: 2 files, both in `src/shared/sequenceGenerator.ts` (+ its test); no raw SQL in domain repos.
