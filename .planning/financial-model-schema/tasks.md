# Financial Model Schema + Calculation Engine Tasks
_Last updated: 2026-04-04 11:30_
_Plan: .planning/financial-model-schema/plan.md_

---

## US-01: Schema migration — new enums, fields, and models
_Priority: P0 | Services: dispatch-api | Status: todo_

**Acceptance Criteria:**
- [ ] Prisma migration applies cleanly (`npx prisma migrate dev`)
- [ ] `LEASED_CARRIER` added to `CarrierType` enum
- [ ] All new enums exist: DriverPayType, FeeType, DispatcherCommType, ExpenseSource, FuelType, Frequency, SettlementStatus, SettlementItemType, MileageSource, LoanType, LoanStatus
- [ ] ExpenseCategory enum replaced with granular user-facing categories (FUEL, MAINTENANCE, TOLLS, etc.)
- [ ] New fields on Load: carrierPayout, companyMargin, driverPay, estimatedHours, estimatedCost, dispatcherComm, dispatcherUserId
- [ ] New fields on Driver: payType, payRate
- [ ] New fields on Carrier: feeType, payFromNet, includeExpensesOnSettlement
- [ ] All new models exist: DispatcherProfile, Expense, RecurringExpense, Settlement, SettlementLineItem, LoadStateMiles, Loan, LoanPayment
- [ ] Old fields (carrierRate, dispatchFee, partnerSplit, TruckExpense) remain untouched

**Tasks:**
[x] T-01 [DB] Add new enums and LEASED_CARRIER to Prisma schema
         └─ Detail: Edit `prisma/schema.prisma`:
            1. Add `LEASED_CARRIER` to `CarrierType` enum (after COMPANY_ASSET)
            2. Replace `ExpenseCategory` enum values (FIXED, VARIABLE, SERVICE, WAGE, DEDUCTION) with granular categories (FUEL, MAINTENANCE, TOLLS, PARKING, MEALS, INSURANCE, TRUCK_PAYMENT, TRAILER_RENTAL, PERMITS_TAGS, SCALES, LUMPER, TIRES, OIL_CHANGE, DEF_FLUID, TRUCK_WASH, ELD_SUBSCRIPTION, PHONE, LODGING, FACTORING_FEE, OTHER)
            3. Add 11 new enums: DriverPayType (PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE), FeeType (PER_LOAD_PERCENT, FLAT_WEEKLY, FLAT_MONTHLY), DispatcherCommType (PERCENTAGE_OF_MARGIN, PERCENTAGE_OF_GROSS, FLAT_PER_LOAD), ExpenseSource (MANUAL, RECURRING, BANK_IMPORT, FUEL_CARD), FuelType (DIESEL, DEF), Frequency (WEEKLY, MONTHLY), SettlementStatus (DRAFT, APPROVED, PAID, DISPUTED), SettlementItemType (LOAD_REVENUE, DISPATCH_FEE, EXPENSE, ACCESSORIAL, ADJUSTMENT), MileageSource (MANUAL, GPS, ELD), LoanType (TRUCK, TRAILER, EQUIPMENT, BUSINESS_LINE), LoanStatus (ACTIVE, PAID_OFF, DEFAULTED)
            DO NOT create the migration yet — that happens after all schema edits.
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-02 [DB] Add new fields to Load, Driver, Carrier models
         └─ Detail: Edit `prisma/schema.prisma`:
            **Load model** — add after `ratePerMile` field:
            - `carrierPayout Decimal? @db.Decimal(10, 2)`
            - `companyMargin Decimal? @db.Decimal(10, 2)`
            - `driverPay Decimal? @db.Decimal(10, 2)`
            - `estimatedHours Decimal? @db.Decimal(5, 1)`
            - `estimatedCost Decimal? @db.Decimal(10, 2)`
            - `dispatcherComm Decimal? @db.Decimal(10, 2)`
            - `dispatcherUserId String?`
            **Driver model** — add after `notes` field:
            - `payType DriverPayType?`
            - `payRate Decimal? @db.Decimal(7, 4)`
            **Carrier model** — add after `feeIncludesAccessorials` field:
            - `feeType FeeType @default(PER_LOAD_PERCENT)`
            - `payFromNet Boolean @default(false)`
            - `includeExpensesOnSettlement Boolean @default(false)`
         └─ Agent: backend
         └─ Depends on: T-01
         └─ Output:

[x] T-03 [DB] Add new models to Prisma schema
         └─ Detail: Edit `prisma/schema.prisma` — add 8 new models after the domain models section:
            1. **DispatcherProfile** — id, membershipId (@unique), commissionType (DispatcherCommType @default(PERCENTAGE_OF_MARGIN)), commissionRate (Decimal @default(0) @db.Decimal(7,4)), timestamps. Relation: membership Membership @relation(fields: [membershipId], references: [id]). Also add `dispatcherProfile DispatcherProfile?` to Membership model.
            2. **Expense** — id, organizationId, vehicleId, driverId?, category (ExpenseCategory), vendor?, amount (Decimal @db.Decimal(10,2)), date (DateTime), state?, notes?, receiptUrl?, isRecurring (Boolean @default(false)), recurringExpenseId?, source (ExpenseSource @default(MANUAL)), externalTransactionId?, gallons? (Decimal @db.Decimal(8,2)), pricePerGallon? (Decimal @db.Decimal(6,3)), fuelType? (FuelType), odometer? (Int), timestamps. Relations: organization, vehicle, driver?, recurringExpense?. Indexes: [vehicleId, date], [organizationId, date], [category]. Add `expenses Expense[]` to Organization, Vehicle, Driver.
            3. **RecurringExpense** — id, organizationId, vehicleId, category (ExpenseCategory), label, amount (Decimal @db.Decimal(10,2)), frequency (Frequency @default(MONTHLY)), dayOfMonth? (Int), isActive (Boolean @default(true)), loanId?, lastGeneratedAt? (DateTime), timestamps. Relations: organization, vehicle, loan? (Loan), expenses (Expense[]). @@unique([vehicleId, label]). Add `recurringExpenses RecurringExpense[]` to Organization, Vehicle.
            4. **Settlement** — id, organizationId, settlementNumber, carrierId, driverId?, vehicleId?, periodStart, periodEnd, grossRevenue (Decimal @db.Decimal(12,2)), totalMiles (Int), dispatchFeeTotal (Decimal @db.Decimal(10,2)), expensesTotal (Decimal @db.Decimal(10,2)), netEarnings (Decimal @db.Decimal(12,2)), status (SettlementStatus @default(DRAFT)), approvedAt?, approvedByUserId?, paidAt?, paymentMethod?, paymentReference?, disputeReason?, timestamps. Relations: organization, carrier, lineItems (SettlementLineItem[]). Indexes: [organizationId, periodStart], [carrierId]. Add `settlements Settlement[]` to Organization, Carrier.
            5. **SettlementLineItem** — id, settlementId, type (SettlementItemType), referenceId?, description, miles? (Int), amount (Decimal @db.Decimal(10,2)), date (DateTime), createdAt. Relation: settlement.
            6. **LoadStateMiles** — id, loadId, state (String @db.Char(2)), miles (Decimal @db.Decimal(8,2)), source (MileageSource @default(MANUAL)), createdAt. Relation: load. @@unique([loadId, state]), @@index([loadId]). Add `stateMiles LoadStateMiles[]` to Load.
            7. **Loan** — id, organizationId, vehicleId, type (LoanType), lender, originalAmount (Decimal @db.Decimal(12,2)), interestRate (Decimal @db.Decimal(5,4)), termMonths (Int), remainingBalance (Decimal @db.Decimal(12,2)), monthlyPayment (Decimal @db.Decimal(10,2)), startDate, maturityDate, status (LoanStatus @default(ACTIVE)), timestamps. Relations: organization, vehicle, recurringExpenses (RecurringExpense[]), payments (LoanPayment[]). Add `loans Loan[]` to Organization, Vehicle.
            8. **LoanPayment** — id, loanId, expenseId?, principal (Decimal @db.Decimal(10,2)), interest (Decimal @db.Decimal(10,2)), totalAmount (Decimal @db.Decimal(10,2)), date (DateTime), createdAt. Relation: loan.
         └─ Agent: backend
         └─ Depends on: T-01
         └─ Output:

[x] T-04 [DB] Run Prisma migration
         └─ Detail: Generate and apply the migration:
            ```bash
            cd hussle-app-dispatch-api && npx prisma migrate dev --name financial_model_phase2 > /tmp/migrate.log 2>&1
            ```
            Verify migration applies cleanly. Check generated SQL for correctness.
            Then generate the Prisma client:
            ```bash
            cd hussle-app-dispatch-api && npx prisma generate > /tmp/prisma-gen.log 2>&1
            ```
            If there are ExpenseCategory enum value changes that conflict with existing TruckExpense data, the migration SQL may need a manual step to map old values. Check the generated migration SQL and add a data migration step inside it if needed (e.g., UPDATE "TruckExpense" SET category = 'OTHER' before altering the enum).
         └─ Agent: backend
         └─ Depends on: T-02, T-03
         └─ Output:

---

## US-02: Update carrier type constants and LEASED_CARRIER support
_Priority: P0 | Services: dispatch-api | Status: todo_

**Acceptance Criteria:**
- [ ] `CARRIER_TYPES` constant includes `LEASED_CARRIER`
- [ ] `calculateLoadFinancials` uses LEASED_CARRIER same as EXTERNAL_CARRIER (totalRevenue = companyMargin)

**Tasks:**
[x] T-05 [TYPES] Add LEASED_CARRIER to carrier type constants
         └─ Detail: Edit `src/shared/constants/carrierTypes.ts`:
            - Add `LEASED_CARRIER: 'LEASED_CARRIER'` to the `CARRIER_TYPES` const object
            This is needed before the calculation engine update since `calculateLoadFinancials` references CARRIER_TYPES.
         └─ Agent: backend
         └─ Depends on: T-04
         └─ Output:

---

## US-03: Unified calculation engine with new financial fields
_Priority: P0 | Services: dispatch-api | Status: todo_

**Acceptance Criteria:**
- [ ] `calculateLoadFinancials` computes `companyMargin` using fee-based formula for ALL carrier types
- [ ] `calculateLoadFinancials` computes `carrierPayout` = gross − companyMargin
- [ ] `calculateLoadFinancials` supports `carrierPayoutOverride` (manual dispatcher override)
- [ ] `calculateLoadFinancials` computes `driverPay` for PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE
- [ ] PERCENTAGE driverPay uses `payFromNet` when true (base = carrierPayout − estimatedCost)
- [ ] `calculateLoadFinancials` computes `estimatedCost` = CPM × totalMiles
- [ ] `calculateLoadFinancials` computes `dispatcherComm` from DispatcherProfile config
- [ ] `calculateLoadFinancials` computes `companyNet` = companyMargin − dispatcherComm
- [ ] Old outputs (`dispatchFee`, `partnerSplit`, `companyShare`) still returned for backward compat
- [ ] All existing tests continue to pass
- [ ] New unit tests for each driver pay formula (4 types)
- [ ] New unit tests for dispatcher commission calculation (3 types)
- [ ] New unit test for unified fee calculation across all carrier types

**Tasks:**
[x] T-06 [API] Update `calculateLoadFinancials` input/output types and core formula
         └─ Detail: Edit `src/shared/financials.ts`:
            **Expand `CarrierInput`:**
            - Add `feeType: FeeType` (import from constants or define locally — only PER_LOAD_PERCENT is implemented)
            - Add `payFromNet: boolean`
            **Expand `LoadFinancialsInput`:**
            - Add `totalMiles: number | null`
            - Add `carrierPayoutOverride?: string`
            - Add `vehicleCpm?: number`
            - Add `driverPay?: { payType: DriverPayType; payRate: string; estimatedHours?: number }`
            - Add `dispatcherComm?: { commissionType: DispatcherCommType; commissionRate: string }`
            **Expand `LoadFinancialsResult`:**
            - Keep existing fields (dispatchFee, partnerSplit, companyShare, totalRevenue, ratePerMile)
            - Add `carrierPayout: string` — gross − companyMargin (or override)
            - Add `companyMargin: string` — same value as dispatchFee (new name)
            - Add `driverPay: string | null`
            - Add `estimatedCost: string | null`
            - Add `dispatcherComm: string | null`
            - Add `companyNet: string | null`
            **Update calculation body:**
            1. After computing dispatchFee, set `companyMargin = dispatchFee` (same value, new name)
            2. Compute `carrierPayout = carrierPayoutOverride ?? round2(gross − companyMargin)`
            3. Compute `estimatedCost = vehicleCpm × totalMiles` (null if either missing)
            4. Call `calculateDriverPay()` helper (new, see below)
            5. Call `calculateDispatcherComm()` helper (new, see below)
            6. Compute `companyNet = companyMargin − dispatcherComm` (null if either null)
            7. Update totalRevenue: LEASED_CARRIER uses same path as EXTERNAL_CARRIER (= companyMargin)
            **Create helper `calculateDriverPay`** (private in same file):
            - Takes: payType, payRate, carrierPayout, loadedMiles, estimatedHours, payFromNet, estimatedCost
            - PERCENTAGE: payBase × payRate / 100 — payBase = carrierPayout, or (carrierPayout − estimatedCost) if payFromNet && estimatedCost available
            - PER_MILE: payRate × loadedMiles (null if no loadedMiles)
            - PER_HOUR: payRate × estimatedHours (null if no estimatedHours)
            - FLAT_RATE: payRate
            - All use Decimal.js with ROUND_HALF_EVEN, 2dp
            **Create helper `calculateDispatcherComm`** (private in same file):
            - Takes: commissionType, commissionRate, companyMargin, gross
            - PERCENTAGE_OF_MARGIN: companyMargin × commissionRate / 100
            - PERCENTAGE_OF_GROSS: gross × commissionRate / 100
            - FLAT_PER_LOAD: commissionRate (as-is)
            - All use Decimal.js with ROUND_HALF_EVEN, 2dp
         └─ Agent: backend
         └─ Depends on: T-05
         └─ Output:

[x] T-07 [TEST] Update existing tests and add new tests for calculation engine
         └─ Detail: Edit `src/shared/__tests__/financials.test.ts`:
            **Update existing tests:**
            - All existing test inputs now need to pass new required fields. Add defaults to existing CarrierInput: `feeType: 'PER_LOAD_PERCENT'`, `payFromNet: false`. Add `totalMiles: null` to LoadFinancialsInput.
            - Existing assertions must still pass — dispatchFee, partnerSplit, companyShare, totalRevenue, ratePerMile unchanged.
            - Add assertions for new fields in existing tests: `companyMargin === dispatchFee`, `carrierPayout === round(gross − companyMargin)`.
            **New test: LEASED_CARRIER uses companyMargin as totalRevenue:**
            - Same as EXTERNAL_CARRIER pattern (totalRevenue = companyMargin, not gross)
            **New tests: driverPay calculation (4 types):**
            - PERCENTAGE: carrierPayout=2520, payRate=50% → driverPay=1260.00
            - PERCENTAGE with payFromNet=true: carrierPayout=2520, estimatedCost=400, payRate=50% → driverPay=1060.00
            - PER_MILE: payRate=0.60, loadedMiles=800 → driverPay=480.00
            - PER_HOUR: payRate=25.00, estimatedHours=12 → driverPay=300.00
            - FLAT_RATE: payRate=500 → driverPay=500.00
            - PER_MILE with null loadedMiles → driverPay=null
            - PER_HOUR with no estimatedHours → driverPay=null
            **New tests: dispatcherComm calculation (3 types):**
            - PERCENTAGE_OF_MARGIN: companyMargin=280, commissionRate=10% → dispatcherComm=28.00
            - PERCENTAGE_OF_GROSS: gross=2800, commissionRate=5% → dispatcherComm=140.00
            - FLAT_PER_LOAD: commissionRate=50 → dispatcherComm=50.00
            **New tests: companyNet:**
            - companyMargin=280, dispatcherComm=28 → companyNet=252.00
            - No dispatcher → companyNet=null
            **New tests: estimatedCost:**
            - vehicleCpm=1.85, totalMiles=800 → estimatedCost=1480.00
            - No vehicleCpm → estimatedCost=null
            **New test: carrierPayoutOverride:**
            - Override=2500.00, ignore computed value → carrierPayout=2500.00
            **New test: unified formula for all carrier types:**
            - COMPANY_ASSET with dispatchFeePercent=0 → companyMargin=0, carrierPayout=gross, totalRevenue=gross
         └─ Agent: backend
         └─ Depends on: T-06
         └─ Output:

---

## US-04: Persistence — updateFinancials + calculateAndPersistFinancials
_Priority: P0 | Services: dispatch-api | Status: todo_

**Acceptance Criteria:**
- [ ] `updateFinancials` persists all new fields to the database
- [ ] Old fields (dispatchFee, partnerSplit) continue to be written for backward compat
- [ ] `calculateAndPersistFinancials` passes new carrier/driver/dispatcher data to the calculation engine

**Tasks:**
[x] T-08 [API] Expand `LoadStatusRepoPort.updateFinancials` and repository implementation
         └─ Detail:
            **Edit `src/loads/types/loadStatusTypes.ts`:**
            - Expand the `updateFinancials` method signature — the `financials` param object should add:
              `carrierPayout: string`, `companyMargin: string`, `driverPay: string | null`, `estimatedCost: string | null`, `dispatcherComm: string | null`
            - Keep existing fields: dispatchFee, partnerSplit, ratePerMile
            **Edit `src/loads/repositories/loadStatusRepositoryPrisma.ts`:**
            - Update `updateFinancials` implementation to write ALL fields to `prisma.load.update`:
              dispatchFee, partnerSplit, ratePerMile (existing) + carrierPayout, companyMargin, driverPay, estimatedCost, dispatcherComm (new)
         └─ Agent: backend
         └─ Depends on: T-04
         └─ Output:

[x] T-09 [API] Update `calculateAndPersistFinancials` to pass new fields
         └─ Detail: Edit `src/loads/services/calculateFinancials.ts`:
            **Expand the `calculateLoadFinancials` call:**
            - Add `totalMiles: load.totalMiles` to the input
            - Add `carrierPayoutOverride: undefined` (not yet wired to UI — future feature)
            - Add `vehicleCpm: undefined` (requires calling `calculateCpm` from `src/shared/scoring/calculateCpm.ts` — but that needs vehicle expenses which are being restructured; leave as undefined for now, wire in a future task)
            - Add carrier fields: `feeType: carrier.feeType ?? 'PER_LOAD_PERCENT'`, `payFromNet: carrier.payFromNet ?? false`
            - Add driver pay input: if `load.driver?.payType && load.driver?.payRate`, pass `{ payType: load.driver.payType, payRate: load.driver.payRate.toString() }`
            - Add dispatcher comm: leave as undefined (DispatcherProfile lookup not yet wired — future task)
            **Expand the `loadStatusRepo.updateFinancials` call:**
            - Pass all new result fields: carrierPayout, companyMargin, driverPay, estimatedCost, dispatcherComm
            **Update the logger.info call** to include new fields.
         └─ Agent: backend
         └─ Depends on: T-06, T-08
         └─ Output:

---

## US-05: Seed data update
_Priority: P1 | Services: dispatch-api | Status: todo_

**Acceptance Criteria:**
- [ ] Seed includes DispatcherProfile records
- [ ] Seed includes driver payType/payRate values
- [ ] Seed includes sample RecurringExpense records
- [ ] Seed includes Carrier feeType/payFromNet/includeExpensesOnSettlement values

**Tasks:**
[x] T-10 [DB] Update seed data with new financial model records
         └─ Detail: Edit `prisma/seed.ts`:
            1. **Carrier updates:** Add `feeType`, `payFromNet`, `includeExpensesOnSettlement` to existing carrier creates. Company-asset carrier: feeType=PER_LOAD_PERCENT, payFromNet=false, includeExpensesOnSettlement=false. External carrier: feeType=PER_LOAD_PERCENT, payFromNet=false, includeExpensesOnSettlement=true.
            2. **Driver updates:** Add `payType` and `payRate` to existing driver creates. At least one PERCENTAGE (payRate=50.0000), one PER_MILE (payRate=0.6000), one PER_HOUR (payRate=25.0000).
            3. **DispatcherProfile:** Create a User + Membership first (if not existing), then create DispatcherProfile with membershipId, commissionType=PERCENTAGE_OF_MARGIN, commissionRate=10.0000.
            4. **RecurringExpense:** Create 2-3 RecurringExpense records linked to existing vehicles. E.g., TRUCK_PAYMENT/$2500/MONTHLY, INSURANCE/$800/MONTHLY.
            5. **TruckExpense category migration:** Update existing TruckExpense seed records to use new ExpenseCategory values (FUEL, INSURANCE, TRUCK_PAYMENT, etc.) instead of old meta-categories (FIXED, VARIABLE, etc.).
            Verify seed runs: `cd hussle-app-dispatch-api && npx prisma db seed > /tmp/seed.log 2>&1`
         └─ Agent: backend
         └─ Depends on: T-04
         └─ Output:

---

## US-06: Data migration scripts
_Priority: P1 | Services: dispatch-api | Status: todo_

**Acceptance Criteria:**
- [ ] Data migration backfills `carrierPayout` from `carrierRate` on existing loads
- [ ] Data migration backfills `companyMargin` from `dispatchFee` on existing loads
- [ ] Data migration parses Driver.notes JSON → payType/payRate columns
- [ ] Data migration creates RecurringExpense rows from TruckExpense rows

**Tasks:**
[x] T-11 [DB] Write data migration SQL in the Prisma migration file
         └─ Detail: Edit the migration SQL file created by T-04 at `prisma/migrations/xxxxxx_financial_model_phase2/migration.sql`:
            Add data migration statements AFTER the schema DDL:
            1. **Backfill Load.carrierPayout from Load.carrierRate:**
               `UPDATE "Load" SET "carrierPayout" = "carrierRate" WHERE "carrierRate" IS NOT NULL;`
            2. **Backfill Load.companyMargin from Load.dispatchFee:**
               `UPDATE "Load" SET "companyMargin" = "dispatchFee" WHERE "dispatchFee" IS NOT NULL;`
            3. **TruckExpense category migration** (before enum change if needed):
               Map old categories to new: FIXED→TRUCK_PAYMENT, VARIABLE→FUEL, SERVICE→MAINTENANCE, WAGE→OTHER, DEDUCTION→OTHER
               This may already be handled by the enum alteration step — check the generated migration SQL.
            4. **Driver.notes JSON parse** — this is complex for raw SQL. Create a small TypeScript migration script instead at `prisma/migrations/xxxxxx_financial_model_phase2/data-migration.ts` that:
               - Reads all Drivers where notes is not null
               - Attempts `JSON.parse(notes)` to check for `{payType, payRate}` shape
               - If found, updates Driver.payType and Driver.payRate
               - Can be run with `npx tsx prisma/migrations/.../data-migration.ts`
            5. **TruckExpense → RecurringExpense migration** — another TypeScript script (same file or separate):
               - Read all TruckExpense rows
               - For each, create RecurringExpense with: vehicleId, mapped category (use same mapping as #3), label=expenseKey, amount=monthlyAmount, frequency=MONTHLY
               - Get organizationId by joining through Vehicle → Carrier → managedByOrgId
         └─ Agent: backend
         └─ Depends on: T-04
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[x] T-12 [VERIFY] Run full validation and trace financial calculation flow
         └─ Detail: Read-only verification:
            1. Run `cd hussle-app-dispatch-api && npm run validate > /tmp/verify-full.log 2>&1`
            2. Trace the financial calculation flow:
               - `calculateLoadFinancials` (src/shared/financials.ts) — verify input/output types match plan
               - `calculateAndPersistFinancials` (src/loads/services/calculateFinancials.ts) — verify it passes all new fields
               - `LoadStatusRepoPort.updateFinancials` (src/loads/types/loadStatusTypes.ts) — verify signature matches
               - `loadStatusRepositoryPrisma.updateFinancials` (src/loads/repositories/loadStatusRepositoryPrisma.ts) — verify all fields persisted
            3. Verify all existing tests still pass
            4. Verify new tests cover: 4 driver pay types, 3 dispatcher comm types, unified fee formula, carrierPayoutOverride, estimatedCost, companyNet
            5. Verify Prisma schema has all new models, enums, and fields from plan
            6. Check every AC from every story is satisfied
         └─ Agent: review
         └─ Depends on: T-07, T-09, T-10, T-11
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 4     | 4    | 0       | 9/9    |
| US-02 | 1     | 1    | 0       | 2/2    |
| US-03 | 2     | 2    | 0       | 13/13  |
| US-04 | 2     | 2    | 0       | 3/3    |
| US-05 | 1     | 1    | 0       | 4/4    |
| US-06 | 1     | 1    | 0       | 4/4    |
| VER-01| 1     | 1    | 0       | —      |
| **All** | **12** | **12** | **0** | **35/35** |
