# Derived Values Removal — Comprehensive Plan (Revised)

## Context

The Prisma schema has accumulated denormalized columns across multiple entities — fields whose value is a cached projection of state that lives in another table. When the source mutates and the cache is not updated, gate decisions, financials, and UI displays go stale. The upload-pipeline-unification work just shipped already corrected three prerequisites (portal writes `Document.expiresAt`, portal publishes `document.confirmed`, validators preserve `metadata`).

This plan **eliminates drift by construction in two coordinated phases**:

- **Phase 1 (Carrier compliance):** drop the 7 Carrier compliance cache columns. Compute on read from `Document` + `Agreement` (single source of truth each).
- **Phase 2 (Load financials):** switch from "live-recompute-from-related-tables" to an **input-snapshot pattern** — snapshot the negotiated rate inputs per Load at booking, drop the cached output columns, compute outputs on read from the per-load snapshots.

App is in active development. One branch (`feature/carrier-portal-v2`). No backwards-compat shims, no phased prod rollout.

## Decisions locked

| # | Decision | Resolution |
|---|---|---|
| D1 | Load financials retroactivity | Input-snapshot pattern: per-load rate inputs snapshotted at booking, editable per-load; output amounts computed on read |
| D2 | Carrier compliance N+1 on list endpoints | Batch prefetch documents + agreements per list query; transformer receives lookup maps |
| D3 | Insurance expiry warning location | Backend (`computeInsuranceStatus` returns `{ onFile, expiresAt, warning }`) |
| D4 | Voided agreement semantics | `Agreement WHERE status=SIGNED AND voidedAt IS NULL ORDER BY signedAt DESC LIMIT 1` |
| D5 | Branch | Continue on `feature/carrier-portal-v2` |
| D6 | Test fixture cleanup | Dedicated audit story between writer deletion and schema migration |
| D7 | `invoiceReadinessSubscriber` | Investigate side effects first; port any notifications/audit entries; then delete |
| D8 | `dispatchAgreementOnFile` source | Agreement table ONLY. Document(type=DISPATCH_AGREEMENT) path is vestigial — delete it. |
| D9 | Phase sequencing | Carrier compliance first (Phase 1) → Load financials (Phase 2). |
| D10 | Admin override checkboxes | Drop — no audit evidence of use in dev. |

## Goal

- `Carrier` has zero compliance-flag columns. State computed on read from `Document` + `Agreement`.
- `Load` has per-load snapshot input columns for all negotiable rates; cached output columns are gone. Outputs computed on read from per-load inputs.
- Dead writers/subscribers deleted (`carrierComplianceSubscriber`, `financialRecalcSubscriber`, Carrier-write half of `agreementSignedSubscriber`, `calculateAndPersistFinancials` persist half, `invoiceReadinessSubscriber` after side-effects ported).
- Admin compliance override checkboxes removed from dispatcher carrier forms.
- New "edit dispatch terms" UI affordance lets dispatchers negotiate per-load terms (writes to input snapshot columns).
- Intentional snapshots preserved (Invoice totals, Settlement after PAID, Agreement webhook timestamps, OnboardingSession.completedAt, Load.estimatedHours / rateConReceivedAt / bolSignedAt / bolUnsignedAt).

## Classification matrix

### Phase 1: DROP from Carrier (7 columns)

| Column | Source of truth |
|---|---|
| `Carrier.insuranceCertOnFile` | `Document WHERE type=INSURANCE_CERT AND isArchived=false AND uploadStatus=confirmed` |
| `Carrier.insuranceExpiry` | `Document.expiresAt` of latest such row |
| `Carrier.w9OnFile` | `Document WHERE type=W9 AND isArchived=false AND uploadStatus=confirmed` |
| `Carrier.carrierPacketOnFile` | `Document WHERE type=CARRIER_PACKET AND isArchived=false AND uploadStatus=confirmed` |
| `Carrier.dispatchAgreementOnFile` | `Agreement WHERE status=SIGNED AND voidedAt IS NULL` |
| `Carrier.signedAgreementId` | `Agreement.id` of latest such row |
| `Carrier.dispatchAgreementSignedAt` | `Agreement.signedAt` of latest such row |

### Phase 2: DROP from Load (10 output cache columns)

`dispatchFee`, `carrierPayout`, `companyMargin`, `driverPay`, `partnerSplit`, `ratePerMile`, `ratePerTotalMile`, `estimatedCost`, `dispatcherComm`, `invoiceReadiness`. All computed from inputs on the Load row.

### Phase 2: ADD to Load (input-snapshot columns)

| Column | Snapshotted from at booking | Editable per-load |
|---|---|---|
| `Load.dispatchFeeType` (rename of `dispatchFeeOverrideType`, enum `DispatchFeeType`) | `Carrier.dispatchFeeType` (verified canonical via `resolveDispatchFee.ts`) | Yes |
| `Load.dispatchFeeAmount` (rename of `dispatchFeeOverrideAmount`) | `Carrier.dispatchFeePercent` or `dispatchFeeAmount` (whichever applies per fee type) | Yes |
| `Load.feeIncludesAccessorials` (new) | `Carrier.feeIncludesAccessorials` | Yes |
| `Load.payFromNet` (new) | `Carrier.payFromNet` | Yes |
| `Load.partnerSplitPercent` (new) | `Carrier.partnerSplitPercent` | Yes |
| `Load.driverPayType` (new) | `Driver.payType` | Yes |
| `Load.driverPayRate` (new) | `Driver.payRate` | Yes |
| `Load.dispatcherCommissionType` (new, enum `DispatcherCommType`) | `DispatcherProfile.commissionType` | Yes |
| `Load.dispatcherCommissionRate` (new) | `DispatcherProfile.commissionRate` | Yes |

Existing orphaned `dispatchFeeOverrideType`/`dispatchFeeOverrideAmount` columns are renamed and become the canonical per-load fee terms.

**NULL semantics.** All 9 new input columns are nullable — driver/dispatcher may not be assigned at booking time. `computeLoadFinancials` treats NULL inputs as zero contribution: missing `driverPayRate` → `driverPay = 0`; missing `dispatcherCommissionRate` → `dispatcherComm = 0`; missing `dispatchFeeType` → `dispatchFee = 0`. This is encoded as truths in US-10.

**Warning thresholds (insurance).** `computeInsuranceStatus.warning`:
- `EXPIRED` when `expiresAt < now`
- `7_DAY` when `expiresAt < now + 7 days` (and not expired)
- `30_DAY` when `expiresAt < now + 30 days` (and not within 7-day window)
- `null` otherwise (or when `expiresAt` is null)

### KEEP-AS-SNAPSHOT (no change)

| Entity | Column | Reason |
|---|---|---|
| Load | `estimatedHours`, `rateConReceivedAt`, `bolSignedAt`, `bolUnsignedAt` | Observed-fact snapshots |
| Invoice | `subtotal`, `accessorials`, `totalAmount`, `paidAmount`, `paidAt` | Financial document; recalc subscriber handles DRAFT drift |
| Settlement | `grossRevenue`, `expensesTotal`, `netEarnings`, `dispatchFeeTotal`, `totalMiles` | Already auto-recalc via `recalculateTotals`; frozen on APPROVED/PAID |
| Agreement | `status`, `signedAt`, `declinedAt`, `expiredAt`, `voidedAt` | DocuSeal webhook authoritative |
| OnboardingSession | `completedAt`, `completedStepIds`, `currentStepId` | Step engine state |
| Document | `isArchived`, `uploadStatus`, `reviewStatus` | Workflow flags |

### No derived columns

All other models (Driver, Vehicle, Customer, Loan, etc.). Nothing to migrate.

---

## Phase 1 — Carrier compliance refactor

### New files

- `hussle-app-dispatch-api/src/carriers/services/derivedCompliance.ts`
  - `computeInsuranceStatus(carrierId, deps) → { onFile, expiresAt, warning }` — warning derived inline from `expiresAt`.
  - `computeW9Status(carrierId, deps) → { onFile }`
  - `computeCarrierPacketStatus(carrierId, deps) → { onFile }`
  - `computeAgreementStatus(carrierId, deps) → { onFile, signedAgreementId, signedAt }`
  - Each accepts port-injected repo functions. No direct Prisma.

- `hussle-app-dispatch-api/src/carriers/services/derivedComplianceBatch.ts`
  - `computeCompliancesForCarriers(carrierIds[], deps) → Map<carrierId, fullComplianceObj>`
  - ONE `Document.findMany({ carrierId in [...], type in [...], isArchived: false })` + ONE `Agreement.findMany({ carrierId in [...], status: SIGNED, voidedAt: null })`. Zero N+1.
  - Used by list-endpoint transformers.

- Tests for both: multi-doc, archived-only, voided-only, missing, edge cases.

### Reader swaps

Replace every read of a Carrier compliance column with a call to the utility. API response field names stay identical — UI unaffected.

- `src/shared/onboardingGate.ts`
- `src/loads/services/loadService.ts` + `src/loads/repositories/loadRepositoryPrisma.ts`
- `src/loads/services/loadStatusService.ts` (status-transition gates)
- `src/carrier-portal/services/onboardingSessionService.ts` + `controllers/sessionController.ts`
- `src/carriers/jobs/documentCheckJob.ts`
- `src/carriers/controllers/transformers/*.ts` — inject computed compliance into payload (single carrier: per-row compute; lists: batch)

### Writer deletions

- Delete `src/carriers/services/carrierComplianceSubscriber.ts` + registration in `src/carriers/compositionRoot.ts`.
- In `src/agreements/repositories/carrierAgreementWriteRepositoryPrisma.ts`: delete `setSignedAgreementId` + `clearSignedAgreement` (column targets gone).
- In `src/agreements/subscribers/agreementSignedSubscriber.ts`: keep (still handles DocuSeal finalize); remove Carrier-write call.
- In `src/carrier-portal/services/portalDocumentsService.ts`: clean up any `COMPLIANCE_FLAG_MAP` remnants (US-01 of upload-pipeline already gutted it).

### UI form deletions

- `features/carrier/components/CarrierFormDialog/index.tsx`, `CreateCarrierForm/index.tsx`, `DispatchTermsDrawer/index.tsx` — remove the 5 compliance Formik fields.
- `features/carrier/validators/{carrierSchema,fleetSchema}.ts` — remove the dropped fields.
- `features/carrier/types.ts` + `onboardingTypes.ts` — keep field NAMES on the response interface (computed in backend, returned in same shape); display code unchanged.
- API: remove the fields from `CreateCarrierInput` / `UpdateCarrierInput` validators in `src/carriers/validators/`.

### Phase 1 test fixture audit (dedicated story)

1. Grep all test files in `hussle-app-dispatch-api/` for the 7 dropped columns.
2. Bulk-update fixtures (remove field if unused) and assertions (check computed response payload instead).
3. Confirm `npm run check-ts` clean BEFORE running migration.

### Phase 1 schema migration

```sql
ALTER TABLE "Carrier"
  DROP COLUMN "insuranceCertOnFile",
  DROP COLUMN "insuranceExpiry",
  DROP COLUMN "w9OnFile",
  DROP COLUMN "carrierPacketOnFile",
  DROP COLUMN "dispatchAgreementOnFile",
  DROP COLUMN "signedAgreementId",
  DROP COLUMN "dispatchAgreementSignedAt";
```

---

## Phase 2 — Load financials refactor (input-snapshot pattern)

### Booking flow update

`loadService.create` and any `loadStatusService` paths that create/modify the booking:
- Read Carrier/Driver/DispatcherProfile at create time.
- Copy rate inputs into the new Load columns.
- Save Load row.
- All subsequent reads use the per-load snapshot; Carrier/Driver/Dispatcher rows can change freely with zero retroactive effect.

### Per-load negotiation UI (new feature)

`hussle-app-dispatch-ui/src/features/load/components/DispatchTermsEditor` — drawer/dialog from load detail. Edits the 9 input snapshot fields. Saves via:

- New API endpoint `PATCH /loads/:id/dispatch-terms` — controller + Yup validator + mapper + service.
- Writes the input snapshot columns; outputs auto-recompute on next read.

### Compute on read

- Refactor `src/shared/financials.ts` `calculateLoadFinancials` to consume per-load inputs (signature changes — no longer takes carrier/driver/dispatcher refs; takes the Load directly).
- `computeLoadFinancials(load, accessorialsSum)` — pure function. No N+1.
- Transformer for Load responses calls `computeLoadFinancials` per row and injects the 9 outputs.

### Investigate `invoiceReadinessSubscriber` (dedicated story)

1. Read `src/invoices/services/invoiceReadinessSubscriber.ts`. Document side effects.
2. If it fires "invoice ready" notifications or audit log entries: port to a new subscriber listening to the same triggers (`document.confirmed`, `load.statusChanged`).
3. Delete the original.
4. Replace `Load.invoiceReadiness` reads with `computeInvoiceReadiness(loadId, deps)` in `derivedFinancials.ts`.

### Writer + subscriber deletions

- Delete `src/loads/services/financialRecalcSubscriber.ts` + registration.
- Delete the `calculateAndPersistFinancials` function in `src/loads/services/calculateFinancials.ts` (keep `deriveEstimatedHours` and any pure helpers).
- Remove persist call sites in `loadStatusService.ts` and `loadService.ts` (3 call sites in loadService).
- Delete `src/invoices/services/invoiceReadinessSubscriber.ts` (after side effects ported per dedicated story).

### Phase 2 test fixture audit

Same pattern as Phase 1; bigger blast radius — more files use Load financial fixtures. Run after writer deletions, before schema migration.

### Phase 2 schema migration

```sql
-- 1. Add input snapshot columns
ALTER TABLE "Load"
  ADD COLUMN "partnerSplitPercent" DECIMAL(5,2),
  ADD COLUMN "driverPayType" "DriverPayType",
  ADD COLUMN "driverPayRate" DECIMAL(10,2),
  ADD COLUMN "dispatcherCommissionType" "DispatcherCommType",
  ADD COLUMN "dispatcherCommissionRate" DECIMAL(5,2),
  ADD COLUMN "feeIncludesAccessorials" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "payFromNet" BOOLEAN NOT NULL DEFAULT false;

-- 2. Rename orphaned override columns to canonical names
ALTER TABLE "Load" RENAME COLUMN "dispatchFeeOverrideType" TO "dispatchFeeType";
ALTER TABLE "Load" RENAME COLUMN "dispatchFeeOverrideAmount" TO "dispatchFeeAmount";

-- 3. Backfill snapshots from related entities for existing rows
UPDATE "Load" l
SET "dispatchFeeType" = COALESCE(l."dispatchFeeType", c."feeType"),
    "dispatchFeeAmount" = COALESCE(l."dispatchFeeAmount", c."dispatchFeePercent"),
    "partnerSplitPercent" = c."partnerSplitPercent",
    "feeIncludesAccessorials" = c."feeIncludesAccessorials",
    "payFromNet" = c."payFromNet"
FROM "Carrier" c WHERE c.id = l."carrierId" AND l."carrierId" IS NOT NULL;

UPDATE "Load" l
SET "driverPayType" = d."payType", "driverPayRate" = d."payRate"
FROM "Driver" d WHERE d.id = l."driverId" AND l."driverId" IS NOT NULL;

-- Backfill dispatcher commission snapshots
-- NOTE: Confirm Load↔Dispatcher relation during US-09; current candidate is Load.dispatcherUserId → DispatcherProfile.userId.
UPDATE "Load" l
SET "dispatcherCommissionType" = dp."commissionType",
    "dispatcherCommissionRate" = dp."commissionRate"
FROM "DispatcherProfile" dp
WHERE dp."userId" = l."dispatcherUserId" AND l."dispatcherUserId" IS NOT NULL;

-- 4. Drop output cache columns
ALTER TABLE "Load"
  DROP COLUMN "dispatchFee",
  DROP COLUMN "carrierPayout",
  DROP COLUMN "companyMargin",
  DROP COLUMN "driverPay",
  DROP COLUMN "partnerSplit",
  DROP COLUMN "ratePerMile",
  DROP COLUMN "ratePerTotalMile",
  DROP COLUMN "estimatedCost",
  DROP COLUMN "dispatcherComm",
  DROP COLUMN "invoiceReadiness";

-- 5. Drop unused enum
DROP TYPE "InvoiceReadiness";  -- if no other model references it (verify first)
```

---

## Critical files to modify

**Phase 1 new:** `src/carriers/services/derivedCompliance.ts`, `derivedComplianceBatch.ts` (+ tests)

**Phase 1 modify (readers):** `src/shared/onboardingGate.ts`, `src/loads/services/{loadService,loadStatusService}.ts`, `src/loads/repositories/loadRepositoryPrisma.ts`, `src/carrier-portal/services/onboardingSessionService.ts`, `src/carrier-portal/controllers/sessionController.ts`, `src/carriers/jobs/documentCheckJob.ts`, `src/carriers/controllers/transformers/*.ts`

**Phase 1 delete:** `src/carriers/services/carrierComplianceSubscriber.ts`; the Carrier-write methods in `src/agreements/repositories/carrierAgreementWriteRepositoryPrisma.ts`

**Phase 1 UI:** `hussle-app-dispatch-ui/src/features/carrier/components/{CarrierFormDialog,CreateCarrierForm,DispatchTermsDrawer}/index.tsx`, `features/carrier/validators/{carrierSchema,fleetSchema}.ts`

**Phase 2 new:** `hussle-app-dispatch-ui/src/features/load/components/DispatchTermsEditor/`, new API endpoint stack for `PATCH /loads/:id/dispatch-terms`

**Phase 2 modify:** `src/shared/financials.ts` (signature change), `src/loads/services/{loadService,loadStatusService}.ts`, `src/loads/repositories/loadRepositoryPrisma.ts`, `src/loads/controllers/transformers/*.ts`, `src/loads/services/calculateFinancials.ts` (purge persist half)

**Phase 2 delete:** `src/loads/services/financialRecalcSubscriber.ts`; `src/invoices/services/invoiceReadinessSubscriber.ts` (after side-effect port)

**Schema:** `hussle-app-dispatch-api/prisma/schema.prisma`; two migration files

## Verification (per phase)

1. `(cd hussle-app-dispatch-api && npx prisma migrate dev)` — applies + regenerates Prisma client.
2. `(cd hussle-app-dispatch-api && npm run validate)` — baseline + 1 pre-existing `docusealProvider` failure.
3. `(cd hussle-app-dispatch-ui && npm test && npm run check-ts)` — 1349 tests baseline.
4. `\d "Carrier"` / `\d "Load"` confirm column changes.

**Phase 1 proofs:**
- Carrier list `http://localhost:5173/carriers` loads with computed compliance badges.
- Upload INSURANCE_CERT via portal → list shows "On file" + expiry.
- **Archive that document** → list immediately shows "Missing" with no cache invalidation step (drift-elimination proof).

**Phase 2 proofs:**
- Open load detail; note `dispatchFee` value.
- Change **carrier-level** `dispatchFeePercent` → load detail UNCHANGED (per-load snapshot intact).
- Edit the **load's** `dispatchFeeAmount` via DispatchTermsEditor → load `dispatchFee` reflects new value.
- Invoice for the load → totals unchanged (Invoice snapshots independent).

## Out of scope

- Migrating Invoice snapshots — immutable legal docs.
- Migrating Settlement snapshots after APPROVED/PAID — intentional freeze.
- Backfill data quality issues — `Document.expiresAt` is NULL on legacy rows; carriers may show "expiry unknown" until they re-upload (acceptable for dev).
- Performance indexes — defer until profiling shows need.
- "Override vs default" UI distinction — for now the per-load values just are the values. Future enhancement could surface "this load uses negotiated terms different from carrier default" as a visual hint.
- **`Carrier.feeType` deletion** — verified vestigial during /prd-refine (only `dispatchFeeType` drives `resolveDispatchFee.ts`; `feeType` is passed through transformers but no logic branches on it). Removing it belongs to a follow-up dead-column-cleanup story, not this plan.
