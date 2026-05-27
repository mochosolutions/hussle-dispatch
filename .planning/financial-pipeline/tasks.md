# Financial Pipeline Tasks
_Last updated: 2026-04-24 — ALL DONE: 49/49 tasks, 53/53 ACs; FIX-08 auth+email+factoring complete_
_Plan: .planning/financial-pipeline/plan.md_
_No contract.yaml — tasks grounded in plan + Prisma schema + existing services_

## Dispatch Batches (consolidated to minimize agent context overhead)

| # | Batch | Stories | Agent |
|---|---|---|---|
| 1 | Schema + migration | US-01 | Direct (no agent) |
| 2 | Backend-FeeConfig | US-02, US-03, US-04 | backend |
| 3 | Backend-Invoices | US-05, US-06 | backend |
| 4 | Backend-Settlements | US-07, US-08, US-09 | backend |
| 5 | Frontend-All | US-10, US-11, US-12, US-13 | frontend |
| 6 | Review-All | INT-01, INT-02, VER-01 | review |

**Dependency chain:** 1 → 2 → (3 ∥ 4) → 5 → 6
Max concurrency: 2 agents (batches 3 and 4 run in parallel).

---

## US-01: Dispatch fee schema + enum additions
_Priority: P0 | Services: dispatch-api | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] `DispatchFeeType` enum (`PERCENTAGE | FLAT`) exists in schema
- [x] `Carrier.dispatchFeeType` (default PERCENTAGE) and `Carrier.dispatchFeeAmount` (default 0, Decimal(10,2)) columns added
- [x] `Carrier.feeIncludesAccessorials` default flipped to `true`
- [x] `Load.dispatchFeeOverrideType` (nullable) and `Load.dispatchFeeOverrideAmount` (nullable Decimal(10,2)) added
- [x] `SettlementItemType` extended with `DRIVER_PAY`
- [x] Migration applied cleanly on dev DB

**Tasks:**
[x] T-01 [DB] Prisma schema edits
         └─ Detail: Edit `hussle-app-dispatch-api/prisma/schema.prisma`.
            - Add `enum DispatchFeeType { PERCENTAGE FLAT }`
            - On `Carrier` model: add `dispatchFeeType DispatchFeeType @default(PERCENTAGE)`,
              `dispatchFeeAmount Decimal @default(0) @db.Decimal(10, 2)`.
              Change `feeIncludesAccessorials Boolean @default(false)` → `@default(true)`.
            - On `Load` model: add `dispatchFeeOverrideType DispatchFeeType?`,
              `dispatchFeeOverrideAmount Decimal? @db.Decimal(10, 2)`.
            - Extend `enum SettlementItemType` with `DRIVER_PAY` (append, do not reorder).
         └─ Depends on: —
         └─ Output:

[x] T-02 [DB] Generate and apply migration
         └─ Detail: Run `cd hussle-app-dispatch-api && npx prisma migrate dev --name financial_pipeline_fee_config`.
            Verify migration SQL is idempotent and does not drop existing data. Commit migration file.
         └─ Depends on: T-01
         └─ Output: migration.sql written manually (shadow DB blocked by pre-existing 20260419 migration).
            Applied via `prisma migrate deploy` inside docker container. Prisma client regenerated.
            Typecheck: 27 errors — all pre-existing TS6059 hussle-emails rootDir (unchanged from before).
            Files: prisma/schema.prisma, prisma/migrations/20260424000000_financial_pipeline_fee_config/migration.sql

---

## US-02: Customer notification settings default on create
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] New customer created via POST /customers has a `CustomerNotificationSettings` row with EMAIL enabled for STATUS_CHANGE, CHECK_CALL, DOCUMENT_UPLOADED
- [x] Unit test covers default insertion

**Tasks:**
[x] T-03 [API] Wire default CustomerNotificationSettings on customer creation
         └─ Detail: Locate the customer create service in `hussle-app-dispatch-api/src/customers/services/`.
            On create, also insert a `CustomerNotificationSettings` row (inside the same transaction if
            a txManager is available) with EMAIL channel enabled for all three triggers: STATUS_CHANGE,
            CHECK_CALL, DOCUMENT_UPLOADED. Use the existing schema shape (check schema.prisma for
            CustomerNotificationSettings model fields).
         └─ Depends on: —
         └─ Output:

[x] T-04 [TEST] Unit test for customer create default notification settings
         └─ Detail: Add a unit test alongside existing customer create tests verifying that
            creating a customer also creates a CustomerNotificationSettings row with EMAIL enabled for
            all three triggers. Mock the repo calls; assert the insert shape.
         └─ Depends on: T-03
         └─ Output:

---

## US-03: Carrier dispatch-fee configuration + EXTERNAL fee > 0 validation
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] POST/PATCH /carriers accepts `dispatchFeeType`, `dispatchFeeAmount`, `feeIncludesAccessorials`
- [x] EXTERNAL_CARRIER with resolved fee = 0 returns 400 with a descriptive error
- [x] COMPANY_ASSET / LEASED_CARRIER allow fee = 0
- [x] Unit test coverage for validation branches

**Tasks:**
[x] T-05 [API] Extend carrier Yup validators
         └─ Detail: In `hussle-app-dispatch-api/src/carriers/validators/`, extend create + update
            validators to include `dispatchFeeType` (oneOf PERCENTAGE/FLAT, required) and
            `dispatchFeeAmount` (number, min 0, required when type=FLAT). Keep
            `dispatchFeePercent` validator as-is.
         └─ Depends on: T-02
         └─ Output:

[x] T-06 [API] Business rule: EXTERNAL must have resolved fee > 0
         └─ Detail: In the carrier service (create + update), add a business rule: if
            `type === 'EXTERNAL_CARRIER'`, the resolved fee must be > 0. Resolution is:
            `type=PERCENTAGE` → `dispatchFeePercent > 0`, `type=FLAT` → `dispatchFeeAmount > 0`.
            Throw `BadRequestError('EXTERNAL_CARRIER requires a non-zero dispatch fee')`.
            Apply same rule when toggling carrier type via update.
         └─ Depends on: T-05
         └─ Output:

[x] T-07 [API] Extend carrier transformer + mapper
         └─ Detail: Update the carrier response transformer (`carriers/controllers/transformers/`)
            to include `dispatchFeeType`, `dispatchFeeAmount`, `feeIncludesAccessorials` in output.
            Update the create/update mappers to pass through the new fields.
         └─ Depends on: T-05
         └─ Output:

[x] T-08 [TEST] Carrier fee validation unit tests
         └─ Detail: Add unit tests in `carriers/services/__tests__/` covering:
            (a) EXTERNAL with PERCENTAGE fee = 0 rejected,
            (b) EXTERNAL with FLAT fee = 0 rejected,
            (c) EXTERNAL with PERCENTAGE > 0 accepted,
            (d) EXTERNAL with FLAT > 0 accepted,
            (e) COMPANY_ASSET with fee = 0 accepted,
            (f) LEASED_CARRIER with fee = 0 accepted.
         └─ Depends on: T-06
         └─ Output:

---

## US-04: Per-load dispatch fee override
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] POST/PATCH /loads accepts `dispatchFeeOverrideType` + `dispatchFeeOverrideAmount`
- [x] Fee resolver prefers load override when present, falls back to carrier config
- [x] Helper function `resolveLoadDispatchFee(load, carrier)` returns a normalized `{ type, percent?, amount? }` shape, usable by invoice + settlement services

**Tasks:**
[x] T-09 [API] Extend load validators + mappers + transformer
         └─ Detail: Extend load create + update validators to accept
            `dispatchFeeOverrideType?` and `dispatchFeeOverrideAmount?`. Update mappers to
            pass them through; transformer to include in response.
         └─ Depends on: T-02
         └─ Output:

[x] T-10 [API] Create shared dispatch fee resolver utility
         └─ Detail: Create `hussle-app-dispatch-api/src/shared/utils/resolveDispatchFee.ts`
            with `resolveDispatchFee({ load, carrier })` returning:
            `{ type: 'PERCENTAGE' | 'FLAT', percent?: Decimal, amount?: Decimal }`.
            Preference order: load override (if both type + value present) → carrier config.
            Add a sibling helper `computeDispatchFeeAmount({ resolvedFee, baseAmount })`
            that returns a `Decimal` fee total given the fee config and the fee base.
            For PERCENTAGE: baseAmount * percent / 100. For FLAT: amount.
         └─ Depends on: T-09
         └─ Output:

[x] T-11 [TEST] Unit tests for resolveDispatchFee + computeDispatchFeeAmount
         └─ Detail: Tests in `shared/utils/__tests__/resolveDispatchFee.test.ts`:
            - Load override wins when both type + value set
            - Falls back to carrier PERCENTAGE
            - Falls back to carrier FLAT
            - computeDispatchFeeAmount for 15% of $3,200 = $480
            - computeDispatchFeeAmount for FLAT $300 = $300 regardless of base
         └─ Depends on: T-10
         └─ Output:

---

## US-05: Invoice generation — dispatch fee base includes accessorials
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] When carrier `feeIncludesAccessorials = true`, dispatch fee base = customerRate + sum(accessorials with billTo ∈ {CUSTOMER, BOTH})
- [x] When false, fee base = customerRate only
- [x] Customer invoice line items include each accessorial (CUSTOMER/BOTH) as distinct rows
- [x] No changes to existing CUSTOMER invoice creation path for LEASED/COMPANY_ASSET
- [x] Unit tests cover both flag states + both fee types

**Tasks:**
[x] T-12 [API] Compute fee base in invoiceBuilderService
         └─ Detail: In `hussle-app-dispatch-api/src/invoices/services/invoiceBuilderService.ts`
            (or invoiceGenerationService.ts — whichever builds the line items), compute the
            fee base using `resolveDispatchFee` + `computeDispatchFeeAmount`. Use the carrier's
            `feeIncludesAccessorials` flag to decide whether to include customer/BOTH accessorials
            in the base. Expose the resolved fee amount for downstream use (US-06).
         └─ Depends on: T-10
         └─ Output:

[x] T-13 [API] Accessorial line items on customer invoice
         └─ Detail: Ensure each AccessorialCharge with billTo ∈ {CUSTOMER, BOTH} appears as a
            distinct line item on the CUSTOMER invoice (not folded into total). Verify this
            matches the existing accessorialSyncSubscriber / builder behavior; if it already does,
            write a test confirming it. If accessorials with billTo=CARRIER are present, they
            are NOT on the customer invoice.
         └─ Depends on: T-12
         └─ Output:

[x] T-14 [TEST] invoiceBuilderService fee-base tests
         └─ Detail: Unit tests in `invoices/services/__tests__/`:
            - PERCENTAGE 15%, feeIncludesAccessorials=true, customerRate $3,000 + accessorial $200 → fee $480
            - Same with flag=false → fee $450
            - FLAT $300 → fee $300 regardless of flag
            - Accessorials with billTo=CARRIER excluded from customer invoice
            - Accessorials with billTo=BOTH included in customer invoice
         └─ Depends on: T-13
         └─ Output:

---

## US-06: EXTERNAL_CARRIER dispatch-fee invoice auto-generation
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] On `load.delivered` for EXTERNAL_CARRIER, a second Invoice with `type=DISPATCH_FEE` is created, billed to the carrier
- [x] LEASED_CARRIER and COMPANY_ASSET deliveries produce exactly one CUSTOMER invoice
- [x] DISPATCH_FEE invoice status flows DRAFT → SENT and is emailed to the carrier primary contact
- [x] Re-invoking the subscriber for the same load does not create a duplicate DISPATCH_FEE invoice
- [x] TONU deliveries do not create DISPATCH_FEE invoice (only CUSTOMER — confirm scope)

**Tasks:**
[x] T-15 [API] Extend invoiceReadinessSubscriber for DISPATCH_FEE invoice
         └─ Detail: In `hussle-app-dispatch-api/src/invoices/services/invoiceReadinessSubscriber.ts`,
            after generating the CUSTOMER invoice, if `carrier.type === 'EXTERNAL_CARRIER'`:
            - Resolve fee via `resolveDispatchFee` + `computeDispatchFeeAmount` (with fee base
              per US-05 rules).
            - Check idempotency: skip if a DISPATCH_FEE invoice for this load already exists.
            - Create invoice with `type=DISPATCH_FEE`, `carrierId` as billee, single line item
              "Dispatch fee for load #{loadNumber}", amount = resolved fee.
            - Status DRAFT, then immediately SENT (mirror existing CUSTOMER email flow).
         └─ Depends on: T-12
         └─ Output:

[x] T-16 [API] Fee invoice email send
         └─ Detail: Extend `invoiceEmailService.ts` (or add a sibling resolver) so DISPATCH_FEE
            invoices send to the carrier's primary contact email (`carrier.primaryContact.email`
            via the existing FK). Subject line and template: reuse the existing invoice email
            template but label it "Dispatch Fee Invoice" in the body. Coordinate with emails
            package if template changes are needed (flag in Output if so).
         └─ Depends on: T-15
         └─ Output:

[x] T-17 [TEST] Subscriber test — EXTERNAL generates two invoices
         └─ Detail: Unit tests in `invoices/services/__tests__/`:
            - EXTERNAL_CARRIER delivered → two invoices (CUSTOMER + DISPATCH_FEE)
            - LEASED_CARRIER delivered → one invoice (CUSTOMER only)
            - COMPANY_ASSET delivered → one invoice (CUSTOMER only)
            - Re-invoking subscriber twice → still only one DISPATCH_FEE (idempotent)
            - TONU → no DISPATCH_FEE invoice
         └─ Depends on: T-16
         └─ Output:

---

## US-07: Settlement generation — DRIVER_PAY line items
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] Settlement for a COMPANY_ASSET driver computes DRIVER_PAY line items per load matching the driver's `payType`
- [x] PERCENTAGE: `carrierPayout * payRate / 100`
- [x] PER_MILE: `loadedMiles * payRate`
- [x] PER_HOUR: `estimatedHours * payRate`
- [x] FLAT_RATE: `payRate` (per load)
- [x] Decimal math: accumulate raw, round once per line item
- [x] Unit tests cover all 4 pay types

**Tasks:**
[x] T-18 [API] Add DRIVER_PAY computation to settlementService.generate
         └─ Detail: In `hussle-app-dispatch-api/src/settlements/services/settlementService.ts`
            `generate` function, for each load in scope: compute DRIVER_PAY from
            `driver.payType` + `driver.payRate`. Write as a SettlementItem with
            `type=DRIVER_PAY`, `loadId`, `amount` (positive — it's a payout to the driver).
            Preserve existing Decimal accumulation pattern.
         └─ Depends on: T-02
         └─ Output:

[x] T-19 [TEST] DRIVER_PAY unit tests
         └─ Detail: Unit tests in `settlements/services/__tests__/`:
            - PERCENTAGE 85% of carrierPayout $2,400 → $2,040
            - PER_MILE 500 miles × $0.55 → $275
            - PER_HOUR 8h × $25 → $200
            - FLAT_RATE $350 per load
            - Multi-load settlement sums DRIVER_PAY correctly
            - Decimal rounding matches existing pattern (verify against existing tests)
         └─ Depends on: T-18
         └─ Output:

---

## US-08: Settlement generation — DISPATCH_FEE deduction for EXTERNAL/LEASED, never for COMPANY_ASSET
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] EXTERNAL_CARRIER settlement includes DISPATCH_FEE deduction line per load
- [x] LEASED_CARRIER settlement includes DISPATCH_FEE deduction line per load when resolved fee > 0; skipped when = 0
- [x] COMPANY_ASSET driver settlement never includes DISPATCH_FEE line, regardless of fee config
- [x] Accessorials with billTo ∈ {CARRIER, BOTH} become ACCESSORIAL deduction lines on carrier settlement
- [x] Net math matches plan example ($3,000 revenue + $200 accessorial passthrough − $480 fee = $2,720 net)

**Tasks:**
[x] T-20 [API] Extend settlementService.generate — DISPATCH_FEE + carrier accessorial lines
         └─ Detail: In `settlementService.ts` generate function:
            - If settlement is for a carrier (EXTERNAL or LEASED): for each load, resolve fee via
              `resolveDispatchFee`/`computeDispatchFeeAmount`; if > 0, add DISPATCH_FEE line (negative/deduction).
            - For each AccessorialCharge with billTo ∈ {CARRIER, BOTH}: add ACCESSORIAL deduction line.
            - Guard: if settlement is for a COMPANY_ASSET driver, do NOT compute DISPATCH_FEE at all.
            - Handle case-mismatch in existing `billTo` values: compare uppercase.
         └─ Depends on: T-10, T-18
         └─ Output:

[x] T-21 [TEST] Carrier settlement end-to-end unit tests
         └─ Detail: Unit tests covering:
            - EXTERNAL with PERCENTAGE 15% fee → LOAD_REVENUE + DISPATCH_FEE deduction
            - EXTERNAL with FLAT $300 fee → correct deduction
            - LEASED with fee > 0 → DISPATCH_FEE deduction (no fee invoice check here)
            - LEASED with fee = 0 → no DISPATCH_FEE line
            - COMPANY_ASSET driver settlement with carrier fee > 0 → NO DISPATCH_FEE line
            - Plan example ($3,000 + $200 carrier-passthrough accessorial − $480 = $2,720 net)
         └─ Depends on: T-20
         └─ Output:

---

## US-09: PER_HOUR blocks settlement when estimatedHours missing
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] Settlement generation returns 400 `{ code: 'MISSING_ESTIMATED_HOURS', loadIds: [...] }` when any PER_HOUR load lacks `estimatedHours`
- [x] No partial settlement is created
- [x] Non-PER_HOUR loads never trigger this block
- [x] Error propagates via typed error class

**Tasks:**
[x] T-22 [API] Add MissingEstimatedHoursError + pre-validation step
         └─ Detail: Create `shared/errors/missingEstimatedHoursError.ts` (extends CustomError,
            statusCode 400, carries `loadIds: string[]`, serializes to
            `{ code: 'MISSING_ESTIMATED_HOURS', loadIds, message }`).
            In `settlementService.generate`, before computing lines: if the driver has
            `payType=PER_HOUR`, scan all in-scope loads; collect any with
            `estimatedHours` null/undefined; if any, throw the error.
         └─ Depends on: T-18
         └─ Output:

[x] T-23 [TEST] PER_HOUR block unit tests
         └─ Detail:
            - PER_HOUR driver with 2 loads, one missing estimatedHours → 400 with both-or-one loadId
            - PER_HOUR driver with all loads having hours → generates normally
            - PER_MILE driver with loads missing estimatedHours → generates normally (not PER_HOUR)
            - Error response shape verified in integration test
         └─ Depends on: T-22
         └─ Output:

---

## US-10: Carrier form — dispatch fee type selector
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] Carrier create/edit drawer shows fee type select (Percentage | Flat)
- [x] Amount field conditional on fee type (percent % suffix vs $ prefix)
- [x] `feeIncludesAccessorials` checkbox visible; defaults to true for new
- [x] EXTERNAL_CARRIER with resolved fee = 0 blocked by Yup schema client-side
- [x] Error from API (400 "EXTERNAL_CARRIER requires non-zero dispatch fee") surfaces inline

**Tasks:**
[x] T-24 [UI] Extend carrier form drawer
         └─ Detail: Locate the carrier form drawer (`features/carrier/`). Add:
            - FeeType select (Percentage / Flat) via existing form select component
            - Conditional amount field (CurrencyField when FLAT, percent input when PERCENTAGE)
            - feeIncludesAccessorials checkbox
            Yup validation: when type=EXTERNAL_CARRIER, require fee > 0 (based on type/value).
         └─ Depends on: T-07
         └─ Output:

[x] T-25 [UI] Wire carrierApi.ts translation for new fields
         └─ Detail: In `features/carrier/api/carrierApi.ts` (the UI wire translator per
            Track 1.BE.3 pattern), pass through `dispatchFeeType`, `dispatchFeeAmount`,
            `feeIncludesAccessorials` on both directions.
         └─ Depends on: T-24
         └─ Output:

[x] T-26 [TEST] Carrier form validation tests
         └─ Detail: RTL tests:
            - EXTERNAL with fee = 0 → inline error blocks submit
            - EXTERNAL with percent > 0 → submits
            - COMPANY_ASSET with fee = 0 → submits
            - Switching type PERCENTAGE ↔ FLAT shows correct amount input
         └─ Depends on: T-25
         └─ Output:

---

## US-11: Invoice list — type badge + filter
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] Invoice list row shows a type Chip (CUSTOMER vs DISPATCH_FEE)
- [x] Filter bar has a type select (All | Customer | Dispatch Fee)
- [x] Filter applies via URL query param and invoice list API call

**Tasks:**
[x] T-27 [UI] Add type chip to invoice list row
         └─ Detail: In the invoice list feature, render a Chip per row. Map
            InvoiceType.CUSTOMER → neutral chip "Customer"; DISPATCH_FEE → secondary chip
            "Dispatch Fee". Use existing Chip component.
         └─ Depends on: —
         └─ Output:

[x] T-28 [UI] Add type filter to invoice list filter bar
         └─ Detail: Add a Select to the filter bar for invoice type. Wire to existing
            list filter Redux slice. If the list API already accepts `type` param, just
            pass through; otherwise flag as NOT YET WIRED and note backend change needed.
         └─ Depends on: T-27
         └─ Output:

---

## US-12: Invoice detail — accessorial breakdown
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] Invoice detail page shows each accessorial line item distinctly with type label + amount
- [x] Totals match sum of line items

**Tasks:**
[x] T-29 [UI] Render accessorial line items section on invoice detail
         └─ Detail: In the invoice detail page, add an "Accessorial Charges" section (or
            ensure line items list includes each accessorial row). Each row: type label
            (from AccessorialType enum) + amount. No change if already present — just
            verify and add test.
         └─ Depends on: —
         └─ Output:

[x] T-30 [TEST] Invoice detail accessorial rendering test
         └─ Detail: RTL test loading an invoice with 2 accessorials and asserting both
            line items render with correct labels and amounts.
         └─ Depends on: T-29
         └─ Output:

---

## US-13: Settlement detail — itemization + PDF download
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] Settlement detail groups line items by type (LOAD_REVENUE / DISPATCH_FEE / DRIVER_PAY / ACCESSORIAL / ADJUSTMENT / EXPENSE)
- [x] Download PDF button visible; hits `GET /settlements/:id/pdf`; returns a downloaded file
- [x] Block error (MISSING_ESTIMATED_HOURS) on generate surfaces a clear dialog listing offending loads with links

**Tasks:**
[x] T-31 [UI] Group settlement line items by type in detail view
         └─ Detail: On `SettlementDetailPage`, render line items grouped under section
            headers per SettlementItemType. Use existing SectionCard component.
         └─ Depends on: —
         └─ Output:

[x] T-32 [UI] Add Download PDF button
         └─ Detail: Add button wired to `GET /settlements/:id/pdf`. Use existing
            download-blob pattern (search REGISTRY-dispatch-ui for download utility).
            On click: fetch blob, trigger browser download with filename
            `settlement-{shortId}.pdf`.
         └─ Depends on: T-31
         └─ Output:

[x] T-33 [UI] Handle MISSING_ESTIMATED_HOURS error on generate
         └─ Detail: When settlement generate returns 400 with
            `{ code: 'MISSING_ESTIMATED_HOURS', loadIds }`, open a dialog listing the load
            numbers as clickable links to each load detail page. Use existing modal registry.
         └─ Depends on: T-31
         └─ Output:

[x] T-34 [TEST] Settlement detail + PDF tests
         └─ Detail:
            - RTL: line items grouped correctly by type
            - RTL: PDF button present and triggers download saga/API call
            - RTL: MISSING_ESTIMATED_HOURS response opens dialog with load links
         └─ Depends on: T-33
         └─ Output:

---

## INT-01: Wire dispatch-api ↔ dispatch-ui integration
_Auto-generated | Services: dispatch-api, dispatch-ui | Agent: review_

**Verification Checklist:**
- [ ] Carrier API accepts + returns `dispatchFeeType`, `dispatchFeeAmount`, `feeIncludesAccessorials`
- [ ] Load API accepts + returns `dispatchFeeOverrideType`, `dispatchFeeOverrideAmount`
- [ ] Invoice list API accepts `type` filter param (if added in T-28)
- [ ] Settlement generate API returns `{ code: 'MISSING_ESTIMATED_HOURS', loadIds }` shape expected by UI
- [ ] Enum values match character-for-character between Prisma enums and UI enums
- [ ] Auth: all endpoints require ADMIN or DISPATCHER

**Tasks:**
[x] T-35 [WIRE] Verify API ↔ UI field and enum alignment
         └─ Detail: Compare:
            - Carrier payload shapes (API response vs UI carrierApi.ts)
            - Load payload shapes (override fields)
            - Invoice list filter (type query param)
            - Settlement generate error payload shape (expected by T-33)
            Report any drift as bugs to add to a FIX story.
         └─ Agent: review
         └─ Depends on: T-26, T-28, T-30, T-34
         └─ Output:

---

## INT-02: Wire dispatch-api ↔ emails integration
_Auto-generated | Services: dispatch-api, emails | Agent: review_

**Verification Checklist:**
- [ ] DISPATCH_FEE invoice email uses an appropriate template (reused or dedicated)
- [ ] Email "To:" = carrier primary contact email
- [ ] Subject and body identify this as a dispatch fee invoice

**Tasks:**
[x] T-36 [WIRE] Verify dispatch-fee invoice email rendering
         └─ Detail: Read invoiceEmailService wiring + any template changes in emails package.
            Confirm the rendered output clearly indicates "Dispatch Fee Invoice" to the carrier,
            contains load number + amount. If template changes are needed but not yet made,
            flag as FIX task.
         └─ Agent: review
         └─ Depends on: T-17
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Agent: review_

**Tasks:**
[x] T-37 [VERIFY] Trace complete feature flow and confirm all ACs
         └─ Detail: For each flow in plan.md (F1 EXTERNAL deliver→invoice, F2 EXTERNAL settlement,
            F3 COMPANY_ASSET settlement, F4 PDF download): trace from trigger through API through
            DB and back to UI. Check every AC from every story is satisfied. Report AC coverage
            as X/Y per story, flag any gaps as FIX items.
         └─ Agent: review
         └─ Depends on: T-35, T-36
         └─ Output:

---

---

## FIX-01: Carrier test fixture drift
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Tasks:**
[x] T-38 [FIX] Add dispatchFeeType + dispatchFeeAmount to all Carrier test fixtures
         └─ Detail: Grep for every test file that builds a fake Carrier object (e.g. loadStatusService.test.ts
            and any others). Schema now requires `dispatchFeeType: 'PERCENTAGE'` and
            `dispatchFeeAmount: Decimal(0)` on Carrier rows. Add those fields to every fixture builder
            so test suites compile. Also set `feeIncludesAccessorials: true` explicitly where fixtures
            existed before the default flip (if any test asserts the old `false` default).
         └─ Depends on: —
         └─ Output:

---

## FIX-02: Verify invoiceReadinessSubscriber tests
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Tasks:**
[x] T-39 [FIX] Run invoiceReadinessSubscriber.test.ts fresh and confirm green
         └─ Detail: Run `npx jest src/invoices/__tests__/invoiceReadinessSubscriber.test.ts` inside
            hussle-app-dispatch-api. Batch 3 refactored the mock setup, so the prior baseline
            failure is likely resolved. If green, mark done. If not, fix whatever's broken to
            match the new port shape (`createFromLoadWithFee`, `invoiceEmailService` DI, widened
            load query fields).
         └─ Depends on: —
         └─ Output:

---

## FIX-03: DRIVER_PAY + ADJUSTMENT in settlement netEarnings
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Tasks:**
[x] T-40 [FIX] Extend netEarnings formula to include DRIVER_PAY and ADJUSTMENT
         └─ Detail: In `src/settlements/services/settlementService.ts` (or wherever `netEarnings`
            is computed — likely `settlementRepo.recalculateTotals` too), change the formula from
            `grossRevenue - dispatchFee + accessorials - expenses`
            to
            `grossRevenue + driverPay - dispatchFee + accessorials - expenses + adjustments`.
            DRIVER_PAY is only present on COMPANY_ASSET driver settlements (guarded in US-08);
            LOAD_REVENUE + DISPATCH_FEE are only on carrier settlements — so the unified formula is
            safe for both branches. ADJUSTMENT is an existing line-item type that was previously
            ignored; include it now (positive = credit, negative = deduction — follow whatever
            sign convention existing ADJUSTMENT tests/fixtures use).
            Update existing tests that asserted net = 0 for driver settlements, and add a new test
            asserting net = sum(DRIVER_PAY) - sum(EXPENSE) + sum(ADJUSTMENT) for a COMPANY_ASSET
            driver settlement with no accessorials/fees.
         └─ Depends on: —
         └─ Output:

---

## FIX-04: PDF builder DRIVER_PAY section
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Tasks:**
[x] T-41 [FIX] Add DRIVER_PAY section to settlementPdfDataBuilder
         └─ Detail: In `src/settlements/services/settlementPdfDataBuilder.ts`, mirror the grouping
            that Batch 5 added to the UI LineItemsTab. Add DRIVER_PAY group output (section header +
            line items rows). Render order should match UI: LOAD_REVENUE, DISPATCH_FEE, DRIVER_PAY,
            ACCESSORIAL, ADJUSTMENT, EXPENSE. Update the PDF snapshot/unit test (if one exists).
         └─ Depends on: —
         └─ Output:

---

## FIX-05: Dispatch-fee invoice email template variant
_Priority: P0 | Services: emails, dispatch-api | Agent: backend | Status: done_

**Tasks:**
[x] T-42 [FIX] Parameterize renderInvoiceEmail by invoice type + sender
         └─ Detail: In `hussle-emails/src/invoice/`:
            - Extend `InvoiceEmailProps` with `invoiceType: 'CUSTOMER' | 'DISPATCH_FEE'` and
              `senderName: string` (the dispatch org name).
            - Subject lines:
              - CUSTOMER: `Invoice {invoiceNumber} from {senderName}`
              - DISPATCH_FEE: `Dispatch Fee Invoice {invoiceNumber} from {senderName}`
            - Body heading follows the same pattern ("Invoice" vs "Dispatch Fee Invoice").
            Then in `hussle-app-dispatch-api/src/invoices/services/invoiceEmailService.ts`, pass the
            invoice's `type` through to `renderInvoiceEmail`, and resolve `senderName` from the
            dispatch org (the load's `organization.name` — already joined, or add to select).
            Add / update a render test for both variants.
         └─ Depends on: —
         └─ Output:

---

## FIX-06: Enrich MissingEstimatedHoursError with load numbers + UI swap
_Priority: P1 | Services: dispatch-api, dispatch-ui | Agent: backend | Status: done_

**Tasks:**
[x] T-43 [FIX] Backend: add loadNumber alongside loadId in error payload
         └─ Detail: In `src/shared/errors/missingEstimatedHoursError.ts`, change constructor signature
            from `(loadIds: string[])` to `(loads: Array<{ id: string; loadNumber: string }>)`.
            Update `serializeErrors`/errorHandler branch to emit
            `{ code, message, loads: [{ id, loadNumber }], loadIds: loads.map(l => l.id) }` —
            keep `loadIds` for back-compat.
            In `settlementService.generate` where the error is thrown, the in-scope loads are
            already in memory — pass `{ id, loadNumber }` objects.
         └─ Depends on: —
         └─ Output:

[x] T-44 [FIX] UI: render load numbers in MissingEstimatedHoursDialog
         └─ Detail: In `dispatch-ui/src/features/accounting/components/MissingEstimatedHoursDialog/`,
            read `loads` from the error state (falling back to `loadIds.map(id => ({ id, loadNumber: id }))`
            for safety). Render the link text as `#{loadNumber}` instead of the raw ID.
            Update the saga state shape + selector + dialog test.
         └─ Depends on: T-43
         └─ Output:

---

## FIX-07: Pre-existing TS errors in financial-pipeline-adjacent UI + financials.test.ts unification
_Priority: P1 | Services: dispatch-ui, dispatch-api | Agent: backend | Status: done_

**Tasks:**
[x] T-45 [FIX] Clear 47 pre-existing UI TS errors in scoped files + unify CarrierInput type
         └─ Detail: Fixed all 47 errors across 22 UI files (Formik variance via `InferType<typeof schema>`;
            fixture drift with explicit `MockInvoiceFixture`; ColDef/RowClickedEvent typed; PDF template
            local types; @mocho/ui barrel CancelButton export; createCarrierSaga firstName/lastName;
            CarrierAutocomplete Chip narrowing). Unified `CarrierInput` to be exported from
            `shared/financials.ts`; test uses `Omit<CarrierInput, 'type'>`.
         └─ Output: UI 320 → 273 errors (47 cleared, 0 new). API 27 unchanged. Tests: UI 22/22, API 30/30 passing.

---

---

## FIX-08: Post-verification polish + factoring-aware invoice auto-send
_Priority: P0 | Services: dispatch-api, dispatch-ui | Agent: backend | Status: done_

**Tasks:**
[x] T-46 [FIX] Settlement routes — role gating
         └─ Detail: Add `requireRole(ROLES.ADMIN, ROLES.DISPATCHER)` middleware to all write endpoints on
            `settlementRoutes.ts` (generate, create, update, adjustments, dispute). Make `/approve` and
            `/pay` ADMIN-only. Match the pattern used on `invoiceRoutes.ts` / `carrierRoutes.ts`.
         └─ Output:

[x] T-47 [FIX] CUSTOMER invoice auto-email from readiness subscriber
         └─ Detail: In `invoiceReadinessSubscriber.ts`, after creating the CUSTOMER invoice on
            AUTO_SEND readiness, fire `invoiceEmailService.sendInvoiceEmail(invoice, customerContactEmail)`.
            Recipient: load contact email (load.contact.email), falling back to customer's primary
            contact email. **BUT** — see T-49 — if the customer is on factoring, skip the email and
            leave the invoice in DRAFT.
         └─ Output:

[x] T-48 [FIX] Remove unused `subject` param from sendInvoiceEmail call
         └─ Detail: `invoiceReadinessSubscriber.ts:94` passes a `subject` arg that `invoiceEmailService`
            ignores (renderInvoiceEmail generates its own). Drop the param from the interface or honor
            it — prefer drop. Update any other call sites.
         └─ Output:

[x] T-49 [FIX] Add billingMethod to Customer + factoring-aware auto-send
         └─ Detail:
            - Schema: add `billingMethod BillingMethod @default(DIRECT)` to `model Customer`. Write
              migration SQL by hand (shadow DB is broken). Apply via `prisma migrate deploy` in docker
              container.
            - Customer validators + mappers + transformer: accept + return `billingMethod`.
            - Invoice readiness subscriber: after creating the CUSTOMER invoice, check
              `customer.billingMethod === 'FACTORING'`. If true, skip the auto-email and leave status
              as DRAFT. Otherwise send per T-47. Log a structured info line when skipping.
            - Load query / invoice builder needs to expose `customer.billingMethod` — widen the select
              if needed.
            - Tests: subscriber test covering DIRECT → CUSTOMER invoice emailed; FACTORING → CUSTOMER
              invoice stays DRAFT, no email.
            - UI: add a billing-method select to the customer form drawer (DIRECT / FACTORING). Single
              field; no need to expose factoringCompanyName/Email on the customer side for MVP.
            - DISPATCH_FEE invoice behavior unchanged (Carrier-level factoring isn't in this fix).
         └─ Output:

---

## Summary
| Story  | Tasks | Done | Blocked | AC Met |
|--------|-------|------|---------|--------|
| US-01  | 2     | 2    | 0       | 6/6    |
| US-02  | 2     | 2    | 0       | 2/2    |
| US-03  | 4     | 4    | 0       | 4/4    |
| US-04  | 3     | 3    | 0       | 3/3    |
| US-05  | 3     | 3    | 0       | 5/5    |
| US-06  | 3     | 3    | 0       | 5/5    |
| US-07  | 2     | 2    | 0       | 6/6    |
| US-08  | 2     | 2    | 0       | 5/5    |
| US-09  | 2     | 2    | 0       | 4/4    |
| US-10  | 3     | 3    | 0       | 5/5    |
| US-11  | 2     | 2    | 0       | 3/3    |
| US-12  | 2     | 2    | 0       | 2/2    |
| US-13  | 4     | 4    | 0       | 3/3    |
| INT-01 | 1     | 1    | 0       | —      |
| INT-02 | 1     | 1    | 0       | —      |
| VER-01 | 1     | 1    | 0       | —      |
| FIX-01 | 1     | 1    | 0       | —      |
| FIX-02 | 1     | 1    | 0       | —      |
| FIX-03 | 1     | 1    | 0       | —      |
| FIX-04 | 1     | 1    | 0       | —      |
| FIX-05 | 1     | 1    | 0       | —      |
| FIX-06 | 2     | 2    | 0       | —      |
| FIX-07 | 1     | 1    | 0       | —      |
| FIX-08 | 4     | 4    | 0       | —      |
| **All**| **49**| **49**| **0**   | **53/53** |
