# Financial Model Redesign — Phase 2: Schema + Calculation Engine

> Design doc: `hussle-app-dispatch-api/docs/designs/financial-model-redesign.md`
> Depends on: `financial-model-bugfixes` (Phase 1 complete)
> Refined: 2026-04-04

## Problem

The financial model lacks key fields for driver pay, dispatcher commission, cost estimation, and carrier payout tracking. Field names are misleading. New carrier types (LEASED_CARRIER) and new business models (expenses, settlements) have no schema support. The calculation engine treats COMPANY_ASSET differently from other carrier types, but the business logic is the same: a fee-based model with 0% default for company-owned trucks.

## Solution Overview

Additive-only schema migration (Migration A) that adds new fields, models, and enums alongside existing ones. No renames or drops — those happen in a future Migration B. The calculation engine is updated to use a unified fee-based formula for all carrier types and populate all new financial fields.

---

## Capabilities

### Must Have (P0)

**Schema migration (additive):**
- New financial fields on Load: `carrierPayout`, `companyMargin`, `driverPay`, `estimatedHours`, `estimatedCost`, `dispatcherComm`, `dispatcherUserId`
- New pay config fields on Driver: `payType`, `payRate`
- New carrier config fields on Carrier: `feeType`, `payFromNet`, `includeExpensesOnSettlement`
- `LEASED_CARRIER` added to CarrierType enum
- All new enums: DriverPayType, FeeType, DispatcherCommType, ExpenseSource, FuelType, Frequency, SettlementStatus, SettlementItemType, MileageSource, LoanType, LoanStatus, expanded ExpenseCategory
- All new models: DispatcherProfile, Expense, RecurringExpense, Settlement, SettlementLineItem, LoadStateMiles, Loan, LoanPayment
- Old fields (`carrierRate`, `dispatchFee`, `partnerSplit`, `TruckExpense`) remain untouched

**Data migration:**
- Backfill `carrierPayout` from existing `carrierRate` values on all loads
- Backfill `companyMargin` from existing `dispatchFee` values on all loads
- Parse `Driver.notes` JSON for `{payType, payRate}` → populate new Driver columns
- Migrate `TruckExpense` rows → `RecurringExpense` rows (keep TruckExpense table for now)

**Calculation engine update:**
- Unified formula for ALL carrier types (COMPANY_ASSET, LEASED_CARRIER, EXTERNAL_CARRIER):
  - `companyMargin` = feeBase × (dispatchFeePercent / 100) — defaults to 0% for company-asset if no fee
  - `carrierPayout` = gross − companyMargin
  - `driverPay` from Driver payType/payRate (PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE)
  - `estimatedCost` = vehicleCpm × totalMiles
  - `dispatcherComm` = commissionRate × companyMargin / 100 (from DispatcherProfile)
  - `companyNet` = companyMargin − dispatcherComm
- All calculations use Decimal.js with banker's rounding (ROUND_HALF_EVEN), 2 decimal places

**Persistence + seed:**
- Expand `loadStatusRepo.updateFinancials` to persist all new fields
- Update `prisma/seed.ts` with new model records (DispatcherProfile, sample expenses, driver payType/payRate)

---

## Data Requirements

### New Fields on Load

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `carrierPayout` | Decimal(10,2) | Yes | What carrier/driver side receives (gross − companyMargin) |
| `companyMargin` | Decimal(10,2) | Yes | Company's gross take per load (fee-based) |
| `driverPay` | Decimal(10,2) | Yes | Calculated driver compensation for this load |
| `estimatedHours` | Decimal(5,1) | Yes | For PER_HOUR drivers — manual or derived from stops |
| `estimatedCost` | Decimal(10,2) | Yes | CPM × totalMiles |
| `dispatcherComm` | Decimal(10,2) | Yes | Dispatcher's commission on this load |
| `dispatcherUserId` | String | Yes | FK to User — which dispatcher handled this load |

### New Fields on Driver

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `payType` | DriverPayType | Yes | PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE |
| `payRate` | Decimal(7,4) | Yes | Rate value — matches percentage storage pattern (e.g., 50.0000 = 50%) |

### New Fields on Carrier

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `feeType` | FeeType | PER_LOAD_PERCENT | How dispatch fee is charged |
| `payFromNet` | Boolean | false | Driver pay calculated from net (gross − costs) instead of gross |
| `includeExpensesOnSettlement` | Boolean | false | Include vehicle expenses as deductions on carrier settlements |

### New Enums

```prisma
enum DriverPayType {
  PERCENTAGE
  PER_MILE
  PER_HOUR
  FLAT_RATE
}

enum FeeType {
  PER_LOAD_PERCENT     // v1 — implemented
  FLAT_WEEKLY          // v2 — column exists, logic deferred
  FLAT_MONTHLY         // v2 — column exists, logic deferred
}

enum DispatcherCommType {
  PERCENTAGE_OF_MARGIN    // % of companyMargin
  PERCENTAGE_OF_GROSS     // % of gross revenue
  FLAT_PER_LOAD           // fixed $ per load
}

enum ExpenseSource {
  MANUAL
  RECURRING
  BANK_IMPORT
  FUEL_CARD
}

enum FuelType {
  DIESEL
  DEF
}

enum Frequency {
  WEEKLY
  MONTHLY
}

enum SettlementStatus {
  DRAFT
  APPROVED
  PAID
  DISPUTED
}

enum SettlementItemType {
  LOAD_REVENUE
  DISPATCH_FEE
  EXPENSE
  ACCESSORIAL
  ADJUSTMENT
}

enum MileageSource {
  MANUAL
  GPS
  ELD
}

enum LoanType {
  TRUCK
  TRAILER
  EQUIPMENT
  BUSINESS_LINE
}

enum LoanStatus {
  ACTIVE
  PAID_OFF
  DEFAULTED
}
```

### Updated Enum: CarrierType

```prisma
enum CarrierType {
  COMPANY_ASSET
  LEASED_CARRIER       // NEW
  EXTERNAL_CARRIER
  OWNER_OPERATOR
}
```

### Updated Enum: ExpenseCategory

Replace meta-categories with granular user-facing categories:

```prisma
enum ExpenseCategory {
  FUEL
  MAINTENANCE
  TOLLS
  PARKING
  MEALS
  INSURANCE
  TRUCK_PAYMENT
  TRAILER_RENTAL
  PERMITS_TAGS
  SCALES
  LUMPER
  TIRES
  OIL_CHANGE
  DEF_FLUID
  TRUCK_WASH
  ELD_SUBSCRIPTION
  PHONE
  LODGING
  FACTORING_FEE
  OTHER
}
```

### New Models

**DispatcherProfile:**
```prisma
model DispatcherProfile {
  id               String             @id @default(uuid())
  membershipId     String             @unique
  commissionType   DispatcherCommType @default(PERCENTAGE_OF_MARGIN)
  commissionRate   Decimal            @default(0) @db.Decimal(7, 4)
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  membership       Membership         @relation(fields: [membershipId], references: [id])
}
```

**Expense:**
```prisma
model Expense {
  id                    String          @id @default(uuid())
  organizationId        String
  vehicleId             String
  driverId              String?
  category              ExpenseCategory
  vendor                String?
  amount                Decimal         @db.Decimal(10, 2)
  date                  DateTime
  state                 String?
  notes                 String?
  receiptUrl            String?
  isRecurring           Boolean         @default(false)
  recurringExpenseId    String?
  source                ExpenseSource   @default(MANUAL)
  externalTransactionId String?
  gallons               Decimal?        @db.Decimal(8, 2)
  pricePerGallon        Decimal?        @db.Decimal(6, 3)
  fuelType              FuelType?
  odometer              Int?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  organization          Organization    @relation(fields: [organizationId], references: [id])
  vehicle               Vehicle         @relation(fields: [vehicleId], references: [id])
  driver                Driver?         @relation(fields: [driverId], references: [id])
  recurringExpense      RecurringExpense? @relation(fields: [recurringExpenseId], references: [id])

  @@index([vehicleId, date])
  @@index([organizationId, date])
  @@index([category])
}
```

**RecurringExpense:**
```prisma
model RecurringExpense {
  id              String          @id @default(uuid())
  organizationId  String
  vehicleId       String
  category        ExpenseCategory
  label           String
  amount          Decimal         @db.Decimal(10, 2)
  frequency       Frequency       @default(MONTHLY)
  dayOfMonth      Int?
  isActive        Boolean         @default(true)
  loanId          String?
  lastGeneratedAt DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  organization    Organization    @relation(fields: [organizationId], references: [id])
  vehicle         Vehicle         @relation(fields: [vehicleId], references: [id])
  loan            Loan?           @relation(fields: [loanId], references: [id])
  expenses        Expense[]

  @@unique([vehicleId, label])
}
```

**Settlement + SettlementLineItem:**
```prisma
model Settlement {
  id                String            @id @default(uuid())
  organizationId    String
  settlementNumber  String
  carrierId         String
  driverId          String?
  vehicleId         String?
  periodStart       DateTime
  periodEnd         DateTime
  grossRevenue      Decimal           @db.Decimal(12, 2)
  totalMiles        Int
  dispatchFeeTotal  Decimal           @db.Decimal(10, 2)
  expensesTotal     Decimal           @db.Decimal(10, 2)
  netEarnings       Decimal           @db.Decimal(12, 2)
  status            SettlementStatus  @default(DRAFT)
  approvedAt        DateTime?
  approvedByUserId  String?
  paidAt            DateTime?
  paymentMethod     String?
  paymentReference  String?
  disputeReason     String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  organization      Organization      @relation(fields: [organizationId], references: [id])
  carrier           Carrier           @relation(fields: [carrierId], references: [id])
  lineItems         SettlementLineItem[]

  @@index([organizationId, periodStart])
  @@index([carrierId])
}

model SettlementLineItem {
  id              String              @id @default(uuid())
  settlementId    String
  type            SettlementItemType
  referenceId     String?
  description     String
  miles           Int?
  amount          Decimal             @db.Decimal(10, 2)
  date            DateTime
  createdAt       DateTime            @default(now())

  settlement      Settlement          @relation(fields: [settlementId], references: [id])
}
```

**LoadStateMiles:**
```prisma
model LoadStateMiles {
  id            String        @id @default(uuid())
  loadId        String
  state         String        @db.Char(2)
  miles         Decimal       @db.Decimal(8, 2)
  source        MileageSource @default(MANUAL)
  createdAt     DateTime      @default(now())

  load          Load          @relation(fields: [loadId], references: [id])

  @@unique([loadId, state])
  @@index([loadId])
}
```

**Loan + LoanPayment (schema only, logic deferred):**
```prisma
model Loan {
  id                String      @id @default(uuid())
  organizationId    String
  vehicleId         String
  type              LoanType
  lender            String
  originalAmount    Decimal     @db.Decimal(12, 2)
  interestRate      Decimal     @db.Decimal(5, 4)
  termMonths        Int
  remainingBalance  Decimal     @db.Decimal(12, 2)
  monthlyPayment    Decimal     @db.Decimal(10, 2)
  startDate         DateTime
  maturityDate      DateTime
  status            LoanStatus  @default(ACTIVE)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  organization      Organization @relation(fields: [organizationId], references: [id])
  vehicle           Vehicle      @relation(fields: [vehicleId], references: [id])
  recurringExpenses RecurringExpense[]
  payments          LoanPayment[]
}

model LoanPayment {
  id            String    @id @default(uuid())
  loanId        String
  expenseId     String?
  principal     Decimal   @db.Decimal(10, 2)
  interest      Decimal   @db.Decimal(10, 2)
  totalAmount   Decimal   @db.Decimal(10, 2)
  date          DateTime
  createdAt     DateTime  @default(now())

  loan          Loan      @relation(fields: [loanId], references: [id])
}
```

---

## Calculation Engine Update

### Updated `calculateLoadFinancials`

**Inputs (expanded):**

```typescript
interface LoadFinancialsInput {
  customerRate: string;
  accessorials: string;
  loadedMiles: number | null;
  totalMiles: number | null;
  carrier: {
    type: CarrierType;
    feeType: FeeType;
    dispatchFeePercent: string;       // Decimal(7,4) stored as string
    feeIncludesAccessorials: boolean;
    payFromNet: boolean;
  };
  carrierPayoutOverride?: string;     // manual override pre-dispatch
  vehicleCpm?: number;                // cost per mile for this vehicle
  driverPay?: {
    payType: DriverPayType;
    payRate: string;                  // Decimal(7,4) stored as string
    estimatedHours?: number;
  };
  dispatcherComm?: {
    commissionType: DispatcherCommType;
    commissionRate: string;           // Decimal(7,4) stored as string
  };
}
```

**Outputs (expanded):**

```typescript
interface LoadFinancialsResult {
  customerRate: string;
  accessorials: string;
  carrierPayout: string;              // what carrier/driver receives
  companyMargin: string;              // company's gross take (fee-based)
  ratePerMile: string | null;         // customerRate / loadedMiles
  driverPay: string | null;           // driver's calculated pay
  estimatedCost: string | null;       // CPM × totalMiles
  dispatcherComm: string | null;      // dispatcher's commission
  companyNet: string | null;          // companyMargin − dispatcherComm
  totalRevenue: string;               // carrier-type-aware (from Phase 1)
}
```

### Unified Calculation (all carrier types)

```
gross = customerRate + accessorials

feeBase = feeIncludesAccessorials ? gross : customerRate
companyMargin = feeBase × (dispatchFeePercent / 100)
  // COMPANY_ASSET: dispatchFeePercent defaults to 0 → companyMargin = 0
  // LEASED_CARRIER / EXTERNAL_CARRIER: typically 10-20%

carrierPayout = carrierPayoutOverride ?? (gross − companyMargin)

ratePerMile = customerRate / loadedMiles (null if no loadedMiles)

driverPay = calculateDriverPay(payType, payRate, carrierPayout, loadedMiles, estimatedHours, payFromNet, estimatedCost)
  PERCENTAGE:  carrierPayout × (payRate / 100)
               OR if payFromNet: (carrierPayout − estimatedCost) × (payRate / 100)
  PER_MILE:    payRate × loadedMiles
  PER_HOUR:    payRate × estimatedHours
  FLAT_RATE:   payRate

estimatedCost = vehicleCpm × totalMiles (null if no CPM or no miles)

dispatcherComm = calculateDispatcherComm(commissionType, commissionRate, companyMargin, gross)
  PERCENTAGE_OF_MARGIN:  companyMargin × (commissionRate / 100)
  PERCENTAGE_OF_GROSS:   gross × (commissionRate / 100)
  FLAT_PER_LOAD:         commissionRate

companyNet = companyMargin − dispatcherComm (null if either is null)

totalRevenue (from Phase 1):
  COMPANY_ASSET: gross
  LEASED_CARRIER / EXTERNAL_CARRIER: companyMargin
```

### Driver Pay Formulas

| Pay Type | Formula | Required |
|----------|---------|----------|
| PERCENTAGE | `payBase × payRate / 100` | carrierPayout |
| PER_MILE | `payRate × loadedMiles` | loadedMiles |
| PER_HOUR | `payRate × estimatedHours` | estimatedHours |
| FLAT_RATE | `payRate` | none |

Pay base for PERCENTAGE: Default is `carrierPayout`. If `carrier.payFromNet = true` and `estimatedCost` is available, base is `carrierPayout − estimatedCost`.

### estimatedHours Derivation

1. If dispatcher provides `estimatedHours` explicitly → use it
2. Else if first PICKUP and last DELIVERY both have `appointmentStart` → derive hours between them
3. Else → null (driver pay is null for PER_HOUR type)

---

## Data Migration

### Backfill Load Financial Fields

For existing loads that have `carrierRate` and/or `dispatchFee`:
- Set `carrierPayout = carrierRate` (the field was always the carrier payout amount)
- Set `companyMargin = dispatchFee` (the field was always the company's margin)
- Leave new fields (`driverPay`, `estimatedCost`, `dispatcherComm`, `companyNet`) as null

### Parse Driver Notes

For each Driver where `notes` contains JSON with `payType`/`payRate`:
- Extract values and write to new `payType` and `payRate` columns
- Keep `notes` for free-text content

### Migrate TruckExpense → RecurringExpense

For each `TruckExpense` row:
- Create a `RecurringExpense` with: `vehicleId`, mapped `category`, `label = expenseKey`, `amount = monthlyAmount`, `frequency = MONTHLY`
- Keep `TruckExpense` table (dropped in Migration B)

---

## Persistence Update

Expand `LoadStatusRepoPort.updateFinancials` to accept and persist all new fields:

```typescript
updateFinancials(
  loadId: string,
  financials: {
    dispatchFee: string;       // existing — still written for backwards compat
    partnerSplit: string;      // existing — still written for backwards compat
    ratePerMile: string | null;
    carrierPayout: string;     // NEW
    companyMargin: string;     // NEW
    driverPay: string | null;  // NEW
    estimatedCost: string | null; // NEW
    dispatcherComm: string | null; // NEW
  },
): Promise<void>;
```

The old fields (`dispatchFee`, `partnerSplit`) continue to be written with the same values as before for backward compatibility. `companyMargin` gets the same value as `dispatchFee`. `carrierPayout` gets the same value as `carrierRate`.

---

## Affected Services

| Service | Changes |
|---------|---------|
| dispatch-api | Prisma schema, migration, seed, `calculateLoadFinancials`, `calculateAndPersistFinancials`, `updateFinancials`, load types, financials tests |

---

## Technical Context

### Existing Code to Reuse
- `calculateLoadFinancials` (`src/shared/financials.ts`) — update, not replace
- `calculateAndPersistFinancials` (`src/loads/services/calculateFinancials.ts`) — expand to pass new fields
- `loadStatusRepo.updateFinancials` — expand to persist new fields
- `calculateCpm` (`src/shared/scoring/calculateCpm.ts`) — source for vehicleCpm input
- All recalculation triggers from Phase 1 (updateLoad, assignLoad, createLoad) — continue working via the same `calculateAndPersistFinancials` call

### Key Decisions
- **Unified fee-based formula for all carrier types** — COMPANY_ASSET uses 0% dispatch fee by default, same calculation path as EXTERNAL/LEASED_CARRIER. Simplifies the engine.
- **Additive migration only** — old fields stay, new fields added alongside. Migration B (renames/drops) is a separate plan.
- **payRate stored as Decimal(7,4)** — matches `dispatchFeePercent`, `partnerSplitPercent` convention. Percentages stored as whole numbers (50.0000 = 50%), calculation divides by 100.
- **Loan/LoanPayment schema only** — models created, no logic. RecurringExpense can link to Loan when implemented.
- **Old fields written for backward compatibility** — `dispatchFee` gets same value as `companyMargin`, `carrierRate` (via existing code) stays until Migration B renames it.
- **OWNER_OPERATOR remains excluded** — still throws `OwnerOperatorNotSupportedError` in calculation engine (decision X-001).

---

## Acceptance Criteria

- [ ] Prisma migration applies cleanly (`npx prisma migrate dev`)
- [ ] All new fields exist on Load, Driver, Carrier models
- [ ] All new enums exist (DriverPayType, FeeType, DispatcherCommType, etc.)
- [ ] All new models exist (DispatcherProfile, Expense, RecurringExpense, Settlement, SettlementLineItem, LoadStateMiles, Loan, LoanPayment)
- [ ] LEASED_CARRIER is a valid CarrierType
- [ ] Data migration backfills `carrierPayout` from `carrierRate` on existing loads
- [ ] Data migration backfills `companyMargin` from `dispatchFee` on existing loads
- [ ] Data migration parses Driver.notes JSON → `payType`/`payRate` columns
- [ ] Data migration creates RecurringExpense rows from TruckExpense rows
- [ ] `calculateLoadFinancials` computes `companyMargin` using fee-based formula for ALL carrier types
- [ ] `calculateLoadFinancials` computes `carrierPayout` = gross − companyMargin
- [ ] `calculateLoadFinancials` supports carrierPayoutOverride (manual dispatcher override)
- [ ] `calculateLoadFinancials` computes `driverPay` for PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE
- [ ] PERCENTAGE driverPay uses `payFromNet` when true (base = carrierPayout − estimatedCost)
- [ ] `calculateLoadFinancials` computes `estimatedCost` = CPM × totalMiles
- [ ] `calculateLoadFinancials` computes `dispatcherComm` from DispatcherProfile config
- [ ] `calculateLoadFinancials` computes `companyNet` = companyMargin − dispatcherComm
- [ ] `updateFinancials` persists all new fields to the database
- [ ] Old fields (`dispatchFee`, `partnerSplit`, `carrierRate`) continue to be written for backward compat
- [ ] Seed data includes DispatcherProfile records, driver payType/payRate, sample expenses
- [ ] All existing tests continue to pass
- [ ] New unit tests for each driver pay formula (4 types)
- [ ] New unit tests for dispatcher commission calculation (3 types)
- [ ] New unit test for unified fee calculation across all carrier types
- [ ] `npm run validate` passes

## Out of Scope

- Field renames (`carrierRate` → `carrierPayout`, `dispatchFee` → `companyMargin`) — Migration B, separate plan
- Drop `partnerSplit` column — Migration B
- Drop `TruckExpense` table — Migration B
- 65+ file rename sweep across API + UI — Migration B
- Settlement generation logic and endpoints
- Expense CRUD endpoints
- IFTA state mileage queries
- Loan logic (schema exists, no business logic)
- Recurring expense auto-generation job
- UI changes
- OWNER_OPERATOR support
- Flat fee billing (FLAT_WEEKLY, FLAT_MONTHLY) — enum exists, logic deferred
