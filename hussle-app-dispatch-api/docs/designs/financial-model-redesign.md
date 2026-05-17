# Financial Model Redesign

> Status: **Draft**
> Scope: Full vision + v1 implementation detail
> Cross-referenced with: `FleetCommand_Accounting_Designer_Brief` (March 2026)

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Financial Vision](#2-financial-vision)
3. [Money Flow](#3-money-flow)
4. [Schema Changes — Load Financial Fields](#4-schema-changes--load-financial-fields)
5. [Carrier Types & Settlement Eligibility](#5-carrier-types--settlement-eligibility)
6. [Calculation Logic](#6-calculation-logic)
7. [Driver Pay Calculation](#7-driver-pay-calculation)
8. [Dispatcher Commission](#8-dispatcher-commission)
9. [Recalculation Triggers & Freeze Rules](#9-recalculation-triggers--freeze-rules)
10. [Expense Tracking (Unified Model)](#10-expense-tracking-unified-model)
11. [Settlements](#11-settlements)
12. [IFTA State Mileage](#12-ifta-state-mileage)
13. [CPM — Estimated vs Actual](#13-cpm--estimated-vs-actual)
14. [API Response Changes](#14-api-response-changes)
15. [Bug Fixes](#15-bug-fixes)
16. [Migration Strategy](#16-migration-strategy)
17. [Open Questions](#17-open-questions)

---

## 1. Problem Statement

The current financial model doesn't align with how trucking company owners think about money. Core issues:

1. **`carrierRate` is disconnected.** Stored as manual input but never auto-calculated, not shown on load detail, and never used in any computation.

2. **No gross profit or margin.** Dispatchers can't see the spread between revenue and cost on a load.

3. **Driver pay doesn't exist on the API.** The UI fakes economics with hardcoded constants (`FUEL_PPG`, `COMPANY_DRIVER_MPG`). Driver pay config lives as unstructured JSON in `Driver.notes`.

4. **Financial recalculation is broken.** `updateLoad` never recalculates. Accessorials added post-dispatch don't update load financial fields.

5. **Per-hour driver pay not supported.** Local/drayage drivers paid by the hour have no path.

6. **Misleading field names.** `partnerSplit` means driver cut. `dispatchFee` is really company margin. `companyShare` gives a negative number for company-asset carriers.

7. **No dispatcher commission.** No per-load tracking, no reporting foundation.

8. **Reporting metrics are wrong.** `loadQueries.ts` sums `carrierRate` as revenue. Weekly gross is wrong for mixed fleets.

9. **No expense tracking.** The accounting brief requires individual expense entries (fuel, maintenance, tolls) but only `TruckExpense` exists (monthly aggregates for CPM estimation).

10. **No settlements.** No way to generate a pay statement for drivers or carrier payout statements.

11. **No IFTA support.** Quarterly fuel tax reporting needs miles-per-state, which doesn't exist.

12. **Leased-on carriers have no distinct model.** Carriers operating under your authority (money flows through you) are treated the same as independent carriers (money flows through them).

---

## 2. Financial Vision

### The Business

This app is built for **trucking company owners**. They may:

- **Own trucks** (COMPANY_ASSET) — they are the carrier, keep full revenue, bear all costs
- **Lease on carriers** (LEASED_CARRIER) — external entity operating under your authority, money flows through you
- **Dispatch for independent carriers** (EXTERNAL_CARRIER) — their entity, their authority, you charge a dispatch fee
- **Broker loads** (future) — buy low from shippers, sell high to carriers, keep the spread

### v1 Scope

| Feature | v1 | v2+ |
|---|:---:|:---:|
| COMPANY_ASSET money flow | Implement | — |
| LEASED_CARRIER money flow | Implement | — |
| EXTERNAL_CARRIER per-load % fee | Implement | — |
| EXTERNAL_CARRIER flat weekly/monthly fee | Design | Implement |
| Broker mode (independent spread) | — | Design + Implement |
| Driver pay (PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE) | Implement | — |
| Dispatcher commission (% of gross, % of margin, flat) | Implement | — |
| Dispatcher commission (tiered) | Design | Implement |
| Owner-operator carrier type | Design | Implement |
| Unified expense model (Expense + RecurringExpense) | Implement | — |
| Fuel entry with IFTA fields | Implement | — |
| Settlements (COMPANY_ASSET + LEASED_CARRIER) | Implement | — |
| IFTA state mileage (AWS Location Services) | Implement | — |
| Loan/liability tracking | Design | Implement |
| Bank/card import (Plaid) | Design | Implement |
| companyNet with CPM-based cost estimation | Implement | — |

---

## 3. Money Flow

### 3a. COMPANY_ASSET — Own Truck (v1)

The company IS the carrier. `customerRate` = `carrierPayout`. All revenue is yours.

```
Customer pays:          $3,000  (customerRate)
+ Detention accessorial:  +$200
                        --------
Gross revenue:           $3,200  (carrierPayout = gross)

Driver pay (part of operating costs, calculated separately for visibility):
  e.g. PERCENTAGE 50% → $1,600
  e.g. PER_MILE $0.55 × 800mi → $440
  e.g. PER_HOUR $25 × 12hr → $300
  e.g. FLAT_RATE → $500

Estimated operating costs (CPM × totalMiles):
  $1.20/mi × 800mi = $960
  (includes driver wages, fuel, maintenance, insurance, etc.)

Dispatcher commission:
  e.g. 10% of gross → $320

Company net:
  $3,200 - $960 (costs) - $320 (dispatcher) = $1,920

Estimated net earnings (truck/driver perspective):
  $3,200 (carrierPayout) - $960 (estimatedCost) = $2,240
```

**Key insight:** Driver pay is conceptually PART of CPM (the WAGE expense category). But dispatchers need to see the specific per-load driver pay amount, so we calculate and store it separately for display. It is NOT subtracted again in companyNet — CPM already accounts for it.

**Documents generated:**
- Customer invoice → broker/shipper ($3,200)
- Driver settlement → your driver (loads - dispatch fee - expenses = net pay)

### 3b. LEASED_CARRIER — Their Entity, Your Authority (v1)

The carrier operates under YOUR MC number. Customer pays you. You deduct your fee and settle with the carrier.

```
Customer pays:          $3,000  (customerRate — paid to YOU)
+ Detention accessorial:  +$200
                        --------
Gross:                   $3,200

Dispatch fee (10%):       $320  (companyMargin — your service fee)
Carrier receives:        $2,880  (carrierPayout — settled to them)

Driver pay (their driver, calculated for visibility):
  e.g. PER_MILE $0.50 × 800mi → $400

Dispatcher commission:
  e.g. 10% of companyMargin → $32

Company net:
  $320 - $32 = $288
```

**Documents generated:**
- Customer invoice → broker/shipper ($3,200)
- Carrier settlement → leased carrier (loads - dispatch fee = carrier payout)

### 3c. EXTERNAL_CARRIER — Their Entity, Their Authority (v1)

Independent carrier. Customer pays them directly. You bill them for your dispatch service.

```
Customer pays:          $3,000  (paid to CARRIER, not you)
+ Detention accessorial:  +$200
                        --------
Gross:                   $3,200

Dispatch fee (10%):       $320  (companyMargin — your service fee)
Carrier keeps:           $3,200  (they collect directly from customer)

Dispatcher commission:
  e.g. 10% of companyMargin → $32

Company net:
  $320 - $32 = $288
```

**Documents generated:**
- Dispatch fee invoice → carrier ($320 — "you owe us for our service")
- NO settlement (money doesn't flow through you)
- NO customer invoice (carrier invoices their own customer)

### 3d. EXTERNAL_CARRIER — Flat Fee (v2 — design only)

Some external carriers pay a flat weekly or monthly fee per truck dispatched.

```
Load detail shows:
  Customer Rate:    $3,000
  Dispatch Fee:     $0 (flat-fee carrier — not per-load)
  Carrier Payout:   $3,000 (keeps everything on this load)

Carrier billing (separate from load financials):
  March 2026: $2,000/month flat fee
  Truck TRK-001: 8 loads dispatched
```

**Schema impact:** `feeType` enum on Carrier with `FLAT_WEEKLY`, `FLAT_MONTHLY`. Column exists in v1, logic deferred.

### 3e. Broker Mode (v2+ — design only)

Company negotiates rates independently with customer and carrier. The spread is the margin.

```
Customer pays:          $3,000  (customerRate)
You pay carrier:        $2,400  (carrierPayout — separately negotiated)
                        --------
Company margin:          $600   (the spread — NOT derived from a fee %)
```

**Schema impact:** Add `BROKER` to `CarrierType` enum. `carrierPayout` is manually entered, not derived.

---

## 4. Schema Changes — Load Financial Fields

### 4a. Field Renames

| Old column | New column | Type | Notes |
|---|---|---|---|
| `carrierRate` | `carrierPayout` | Decimal(10,2) | Auto-derived, dispatcher can override pre-dispatch |
| `dispatchFee` | `companyMargin` | Decimal(10,2) | Company's gross take per load |
| `partnerSplit` | *(dropped)* | — | Replaced by driverPay + clearer carrierPayout logic |
| `ratePerMile` | `ratePerMile` | Decimal(6,2) | Unchanged — `customerRate / loadedMiles` |

### 4b. New Fields on Load

| Column | Type | Purpose |
|---|---|---|
| `driverPay` | Decimal(10,2)? | Calculated driver compensation for this load |
| `estimatedHours` | Decimal(5,1)? | For PER_HOUR drivers — auto-derived or manual |
| `estimatedCost` | Decimal(10,2)? | CPM �� totalMiles — estimated operating cost |
| `dispatcherComm` | Decimal(10,2)? | Dispatcher's commission on this load |
| `dispatcherUserId` | String? | FK to User — which dispatcher handled this load |

### 4c. New Fields on Driver

| Column | Type | Purpose |
|---|---|---|
| `payType` | DriverPayType? | PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE |
| `payRate` | Decimal(10,4)? | The rate value (%, $/mi, $/hr, or flat $) |

```prisma
enum DriverPayType {
  PERCENTAGE
  PER_MILE
  PER_HOUR
  FLAT_RATE
}
```

**Migration:** Parse existing `Driver.notes` JSON (`{payType, payRate}`) → populate new columns. Keep `notes` for free-text.

### 4d. New/Modified Fields on Carrier

| Column | Type | Default | Purpose |
|---|---|---|---|
| `feeType` | FeeType | `PER_LOAD_PERCENT` | How dispatch fee is charged |
| `payFromNet` | Boolean | `false` | Carrier paid from net (gross - costs) instead of gross |
| `includeExpensesOnSettlement` | Boolean | `false` | Include vehicle expenses as deductions on carrier settlements (LEASED_CARRIER) |

```prisma
enum CarrierType {
  COMPANY_ASSET        // your truck, your driver
  LEASED_CARRIER       // their entity, your authority (NEW)
  EXTERNAL_CARRIER     // their entity, their authority
  OWNER_OPERATOR       // future
}

enum FeeType {
  PER_LOAD_PERCENT     // v1 — implemented
  FLAT_WEEKLY          // v2 — column exists, logic deferred
  FLAT_MONTHLY         // v2 — column exists, logic deferred
}
```

**Existing fields kept:** `dispatchFeePercent`, `feeIncludesAccessorials`, `ownerOpPayPercent`

**Dropped from calculation flow:** `partnerSplitPercent` — driver pay is now on the Driver model, not the Carrier.

### 4e. Dispatcher Commission Config

```prisma
model DispatcherProfile {
  id               String              @id @default(uuid())
  membershipId     String              @unique
  commissionType   DispatcherCommType  @default(PERCENTAGE_OF_MARGIN)
  commissionRate   Decimal             @default(0) @db.Decimal(7, 4)
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt
  membership       Membership          @relation(fields: [membershipId], references: [id])
}

enum DispatcherCommType {
  PERCENTAGE_OF_MARGIN    // % of companyMargin
  PERCENTAGE_OF_GROSS     // % of gross revenue
  FLAT_PER_LOAD           // fixed $ per load
  // TIERED               // v2 — volume-based brackets
}
```

---

## 5. Carrier Types & Settlement Eligibility

| Carrier Type | Money Flow | Customer Invoice | Settlement | Dispatch Fee Invoice |
|---|---|---|---|---|
| COMPANY_ASSET | Through you | Yes | Yes — driver settlement | No |
| LEASED_CARRIER | Through you | Yes (under your authority) | Yes — carrier settlement | No |
| EXTERNAL_CARRIER | Through them | No (they invoice their own customer) | No | Yes — bill for dispatch fee |
| OWNER_OPERATOR | TBD (future) | TBD | TBD | TBD |

---

## 6. Calculation Logic

### 6a. Updated `calculateLoadFinancials`

**Inputs:**

```typescript
interface LoadFinancialsInput {
  customerRate: string;
  accessorials: string;
  loadedMiles: number | null;
  totalMiles: number | null;
  carrier: {
    type: CarrierType;
    feeType: FeeType;
    dispatchFeePercent: string;
    feeIncludesAccessorials: boolean;
    payFromNet: boolean;
  };
  carrierPayoutOverride?: string;
  vehicleCpm?: number;
  driverPay?: {
    payType: DriverPayType;
    payRate: string;
    estimatedHours?: number;
  };
  dispatcherComm?: {
    commissionType: DispatcherCommType;
    commissionRate: string;
  };
}
```

**Outputs:**

```typescript
interface LoadFinancialsResult {
  carrierPayout: string;          // what carrier/driver side receives
  companyMargin: string;          // company's gross take
  ratePerMile: string | null;     // customerRate / loadedMiles
  carrierRpm: string | null;      // carrierPayout / loadedMiles
  driverPay: string | null;       // driver's calculated pay
  estimatedCost: string | null;   // CPM × totalMiles
  dispatcherComm: string | null;  // dispatcher's commission
  companyNet: string | null;      // company keeps after costs + commission
}
```

### 6b. Calculation by Carrier Type

**COMPANY_ASSET:**

```
gross = customerRate + accessorials
carrierPayout = gross
estimatedCost = vehicleCpm × totalMiles       // null if no CPM data
companyMargin = gross - estimatedCost          // profit margin, not fee (see Appendix A1)
driverPay = calculateDriverPay(...)
dispatcherComm = calculateDispatcherComm(...)
companyNet = companyMargin - dispatcherComm    // margin minus commission
ratePerMile = customerRate / loadedMiles
carrierRpm = null  // not applicable
```

**LEASED_CARRIER (PER_LOAD_PERCENT):**

Same calculation as EXTERNAL_CARRIER below, but money flows through you and carrier gets a settlement.

**EXTERNAL_CARRIER (PER_LOAD_PERCENT):**

```
gross = customerRate + accessorials
feeBase = feeIncludesAccessorials ? gross : customerRate
companyMargin = feeBase × (dispatchFeePercent / 100)
carrierPayout = gross - companyMargin
  (or carrierPayoutOverride if dispatcher manually set it)
driverPay = calculateDriverPay(...)
dispatcherComm = calculateDispatcherComm(...)
companyNet = companyMargin - dispatcherComm
ratePerMile = customerRate / loadedMiles
carrierRpm = carrierPayout / loadedMiles
```

**EXTERNAL_CARRIER (FLAT_WEEKLY / FLAT_MONTHLY) — v2:**

```
companyMargin = 0
carrierPayout = gross
dispatcherComm = 0
companyNet = 0
```

**All calculations use Decimal.js with banker's rounding (ROUND_HALF_EVEN) to 2 decimal places.**

---

## 7. Driver Pay Calculation

### 7a. Pay Type Formulas

| Pay type | Formula | Required inputs |
|---|---|---|
| `PERCENTAGE` | `payBase × payRate / 100` | carrierPayout must be set |
| `PER_MILE` | `payRate × loadedMiles` | loadedMiles must be set |
| `PER_HOUR` | `payRate × estimatedHours` | estimatedHours must be set |
| `FLAT_RATE` | `payRate` | None |

**Pay base for PERCENTAGE:** Default is gross (carrierPayout). If `carrier.payFromNet = true`, base is `gross - estimatedCost`.

### 7b. estimatedHours Derivation

For PER_HOUR drivers:

1. If dispatcher provides `estimatedHours` explicitly → use it
2. Else if first PICKUP and last DELIVERY both have `appointmentStart` → derive hours between them
3. Else → `null` (can't calculate)

### 7c. When to Calculate

- `assignLoad` — driver assigned or changed
- `createLoad` — if carrier + driver provided at creation
- `updateLoad` pre-dispatch — if `customerRate`, `loadedMiles`, `estimatedHours`, or carrier/driver change
- Accessorial change — if `feeIncludesAccessorials=true` and driver pay type is PERCENTAGE

### 7d. Driver Pay Data Migration

1. Add `payType` and `payRate` columns to Driver (nullable)
2. Parse `Driver.notes` JSON where it contains `{payType, payRate}` → write to new columns
3. Update carrier portal `portalDriversService.ts` to write new columns
4. Keep `notes` for free-text

---

## 8. Dispatcher Commission

### 8a. Commission Types (v1)

| Type | Formula | Typical use |
|---|---|---|
| `PERCENTAGE_OF_MARGIN` | `commissionRate × companyMargin / 100` | Most common |
| `PERCENTAGE_OF_GROSS` | `commissionRate × gross / 100` | Dispatcher earns % of total |
| `FLAT_PER_LOAD` | `commissionRate` | Fixed amount per load |

### 8b. Tiered Commission (v2 — design only)

Volume brackets change rate based on monthly load count:

```
Loads 1-20:   10% of margin
Loads 21-40:  12% of margin
Loads 41+:    15% of margin
```

Schema supports `TIERED` via enum. Bracket config as JSON or related `CommissionTier` model. Logic deferred.

### 8c. Per-Load Tracking

Each load stores `dispatcherComm` + `dispatcherUserId`. Enables:
- Dispatcher income reports
- Carrier settlement line items (for LEASED_CARRIER)
- **Never** on customer invoices

### 8d. When to Calculate

Same triggers as financial recalculation (Section 9). Recalculates whenever `companyMargin` or gross changes.

---

## 9. Recalculation Triggers & Freeze Rules

### 9a. When Financials Recalculate

| Trigger | What recalculates | Status restriction |
|---|---|---|
| `createLoad` with carrier | All financial fields | Any (pre-dispatch) |
| `assignLoad` | All financial fields + deadheadMiles | Any |
| `updateLoad` — rate/carrier/driver/hours changed | All financial fields | Pre-DISPATCHED only for customerRate |
| Accessorial created/updated/deleted | companyMargin, carrierPayout, driverPay (if PERCENTAGE), dispatcherComm | **Any status** — not blocked by freeze |
| Status → BOOKED (side effect) | Full recalculation | N/A |

### 9b. Freeze Rules After DISPATCHED

| Field | Frozen? | Rationale |
|---|---|---|
| `customerRate` | **Yes** | Contract is set |
| `carrierPayout` (manual override) | **Yes** | Negotiated amount locked |
| `companyMargin` | **No** — recalculates from accessorials | Accessorials flow through |
| `carrierPayout` (derived) | **No** — tracks companyMargin changes | Keeps carrier payout accurate |
| `ratePerMile` | **Yes** | customerRate / loadedMiles won't change |
| `driverPay` | **No** — recalculates if carrierPayout changes (PERCENTAGE) | Accessorial-driven propagation |
| `dispatcherComm` | **No** — tracks companyMargin changes | Commission tracks actual margin |
| `estimatedCost` | **Yes** | CPM × miles, neither changes post-dispatch |

### 9c. Accessorial-Driven Recalculation

Extend `accessorialSyncSubscriber` to also:

1. Re-sum accessorials for the load
2. Recalculate `companyMargin` (if `feeIncludesAccessorials = true`)
3. Recalculate `carrierPayout` (derived from new companyMargin)
4. Recalculate `driverPay` (if PERCENTAGE type)
5. Recalculate `dispatcherComm` (margin changed)
6. Persist updated fields to the Load record
7. Update invoice totals (existing behavior)

---

## 10. Expense Tracking (Unified Model)

### 10a. Design Principle

One system for all costs. `TruckExpense` (monthly aggregates for CPM) and the accounting brief's expense entries are unified into `Expense` + `RecurringExpense`. CPM becomes a query over real data instead of a separate static table.

### 10b. Expense Model

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
  state                 String?         // two-letter code, critical for IFTA
  notes                 String?
  receiptUrl            String?
  isRecurring           Boolean         @default(false)
  recurringExpenseId    String?         // FK if auto-generated from recurring
  source                ExpenseSource   @default(MANUAL)
  externalTransactionId String?         // dedup key for bank imports (future)
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  // Fuel-specific fields (null for non-fuel expenses)
  gallons               Decimal?        @db.Decimal(8, 2)
  pricePerGallon        Decimal?        @db.Decimal(6, 3)
  fuelType              FuelType?       // DIESEL | DEF
  odometer              Int?

  vehicle               Vehicle         @relation(fields: [vehicleId], references: [id])
  recurringExpense      RecurringExpense? @relation(fields: [recurringExpenseId], references: [id])

  @@index([vehicleId, date])
  @@index([organizationId, date])
  @@index([category])
}

enum ExpenseSource {
  MANUAL            // driver or dispatcher entered
  RECURRING         // auto-generated from RecurringExpense
  BANK_IMPORT       // future — Plaid/bank feed
  FUEL_CARD         // future — fuel card integration
}

enum FuelType {
  DIESEL
  DEF               // not subject to IFTA
}
```

**ExpenseCategory enum (expanded from current):**

```prisma
// User-facing categories only (meta-categories removed — see Appendix A7 for CPM mapping)
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

> **Note:** The old `TruckExpense` meta-categories (FIXED, VARIABLE, SERVICE, WAGE, DEDUCTION) are removed from the enum. CPM grouping uses a code-level mapping from granular categories to FIXED/VARIABLE. See **Appendix A7** for the full mapping.

### 10c. RecurringExpense Model (replaces TruckExpense)

```prisma
model RecurringExpense {
  id            String          @id @default(uuid())
  organizationId String
  vehicleId     String
  category      ExpenseCategory
  label         String          // "Truck Payment", "Insurance", etc.
  amount        Decimal         @db.Decimal(10, 2)
  frequency     Frequency       @default(MONTHLY)
  dayOfMonth    Int?            // 1-28, when to auto-generate
  isActive      Boolean         @default(true)
  loanId        String?         // FK to Loan if this is a loan payment (v2)
  lastGeneratedAt DateTime?     // idempotency — skip if already generated this period
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  vehicle       Vehicle         @relation(fields: [vehicleId], references: [id])
  loan          Loan?           @relation(fields: [loanId], references: [id])
  expenses      Expense[]       // auto-generated entries

  @@unique([vehicleId, label])
}

enum Frequency {
  WEEKLY
  MONTHLY
}
```

**Auto-generation:** A scheduled job runs on the configured `dayOfMonth` (default: 1st) and creates `Expense` records from active `RecurringExpense` entries. Generated expenses have `isRecurring = true` and `source = RECURRING`.

### 10d. Loan Model (v2 — design only, implement later)

```prisma
model Loan {
  id                String      @id @default(uuid())
  organizationId    String
  vehicleId         String
  type              LoanType
  lender            String
  originalAmount    Decimal     @db.Decimal(12, 2)
  interestRate      Decimal     @db.Decimal(5, 4)  // annual rate, e.g. 0.0650 = 6.5%
  termMonths        Int
  remainingBalance  Decimal     @db.Decimal(12, 2)
  monthlyPayment    Decimal     @db.Decimal(10, 2)
  startDate         DateTime
  maturityDate      DateTime
  status            LoanStatus  @default(ACTIVE)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  vehicle           Vehicle     @relation(fields: [vehicleId], references: [id])
  recurringExpenses RecurringExpense[]
  payments          LoanPayment[]
}

model LoanPayment {
  id                String    @id @default(uuid())
  loanId            String
  expenseId         String?   // links to the Expense record
  principal         Decimal   @db.Decimal(10, 2)
  interest          Decimal   @db.Decimal(10, 2)
  totalAmount       Decimal   @db.Decimal(10, 2)
  date              DateTime
  createdAt         DateTime  @default(now())

  loan              Loan      @relation(fields: [loanId], references: [id])
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

**v1:** Schema exists but no loan logic. RecurringExpense entries with `loanId = null` work as simple recurring costs. When loans are implemented, linking a RecurringExpense to a Loan enables auto-splitting payments into principal vs interest (interest → expense, principal → debt reduction).

### 10e. TruckExpense Migration

1. For each `TruckExpense` row, create a `RecurringExpense` with matching fields
2. Map `TruckExpense.expenseKey` → `RecurringExpense.label`
3. Map `TruckExpense.monthlyAmount` → `RecurringExpense.amount`
4. Map `TruckExpense.category` → nearest granular `ExpenseCategory`
5. Drop `TruckExpense` table after migration
6. Update `calculateCpm` to query `RecurringExpense` (estimated) or `Expense` (actual)

---

## 11. Settlements

### 11a. Who Gets Settlements

| Carrier Type | Settlement Type | What it shows |
|---|---|---|
| COMPANY_ASSET | Driver settlement | Loads run, dispatch fee deducted, expenses charged, net pay |
| LEASED_CARRIER | Carrier settlement | Loads dispatched, dispatch fee deducted, carrier payout |
| EXTERNAL_CARRIER | None (dispatch fee invoice only) | N/A |

### 11b. Settlement Model

```prisma
model Settlement {
  id                String            @id @default(uuid())
  organizationId    String
  settlementNumber  String            // SETT-20260323-XXXX
  carrierId         String
  driverId          String?           // null for carrier-level settlements
  vehicleId         String?
  periodStart       DateTime
  periodEnd         DateTime
  grossRevenue      Decimal           @db.Decimal(12, 2)
  totalMiles        Int
  dispatchFeeTotal  Decimal           @db.Decimal(10, 2)  // sum of companyMargin across loads
  expensesTotal     Decimal           @db.Decimal(10, 2)  // sum of expenses in period
  netEarnings       Decimal           @db.Decimal(12, 2)  // gross - dispatchFee - expenses
  status            SettlementStatus  @default(DRAFT)
  approvedAt        DateTime?
  approvedByUserId  String?
  paidAt            DateTime?
  paymentMethod     String?
  paymentReference  String?
  disputeReason     String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  carrier           Carrier           @relation(fields: [carrierId], references: [id])
  lineItems         SettlementLineItem[]

  @@index([organizationId, periodStart])
  @@index([carrierId])
}

model SettlementLineItem {
  id              String              @id @default(uuid())
  settlementId    String
  type            SettlementItemType
  referenceId     String?             // loadId or expenseId
  description     String
  miles           Int?
  amount          Decimal             @db.Decimal(10, 2)
  date            DateTime
  createdAt       DateTime            @default(now())

  settlement      Settlement          @relation(fields: [settlementId], references: [id])
}

enum SettlementStatus {
  DRAFT
  APPROVED
  PAID
  DISPUTED
}

enum SettlementItemType {
  LOAD_REVENUE        // gross revenue from a delivered load
  DISPATCH_FEE        // companyMargin deduction (shown as negative)
  EXPENSE             // fuel, maintenance, etc. (shown as negative)
  ACCESSORIAL         // accessorial charges
  ADJUSTMENT          // manual adjustments
}
```

### 11c. Settlement Generation

1. Select period (typically weekly, Mon–Sun)
2. Query delivered loads for the driver/carrier in that period
3. For each load: create LOAD_REVENUE line item (gross) + DISPATCH_FEE line item (companyMargin as deduction)
4. Query expenses for the vehicle in that period → EXPENSE line items
5. Calculate totals: `netEarnings = grossRevenue - dispatchFeeTotal - expensesTotal`
6. Create settlement in DRAFT status

### 11d. Settlement Workflow

```
DRAFT → APPROVED → PAID
  ↑         |
  └── DISPUTED (back to review)
```

- **DRAFT:** Auto-generated. Dispatcher reviews for accuracy.
- **APPROVED:** Dispatcher confirms. Ready for payment.
- **PAID:** Payment recorded (method, reference, date).
- **DISPUTED:** Driver/carrier flags issue. Returns to DRAFT for correction.

### 11e. Settlement vs Invoice

| | Invoice | Settlement |
|---|---|---|
| Direction | Money IN (receivable) | Money OUT (payable) |
| Recipient | Customer/broker or external carrier | Your driver or leased carrier |
| Per load | One invoice per load | One settlement per period (aggregates loads) |
| Contains | Rate + accessorials | Loads + deductions + expenses + net pay |
| Workflow | DRAFT → APPROVED → SENT → PAID | DRAFT → APPROVED → PAID |

### 11f. Settlement on the Accounting Earnings Dashboard

The accounting brief's Earnings Dashboard shows net earnings from the **driver/truck perspective**. This is the settlement view:

```
Gross revenue:          $4,850  (sum of delivered loads)
- Dispatch fee (8%):     -$388  (companyMargin, shown as deduction)
- Fuel:                -$1,240  (actual expenses)
- Maintenance:           -$180
- Tolls:                  -$85
= NET EARNINGS:         $2,957
```

The `companyMargin` field from our financial model appears here as a **deduction** — same number, different framing (company's revenue vs driver's cost).

---

## 12. IFTA State Mileage

### 12a. The Problem

IFTA requires miles driven per state per quarter. A load's stops have origin/destination states, but not the route through intermediate states. A Newark NJ → Charlotte NC load passes through NJ, PA, MD, VA, NC.

### 12b. Solution: AWS Location Services

Use the existing AWS Location Services integration to calculate route geometry, then derive state-by-state mileage from the route polyline by intersecting with state boundaries.

### 12c. LoadStateMiles Model

```prisma
model LoadStateMiles {
  id        String  @id @default(uuid())
  loadId    String
  state     String  // two-letter state code
  miles     Int
  source    MileageSource @default(ROUTING_API)
  createdAt DateTime @default(now())

  load      Load    @relation(fields: [loadId], references: [id])

  @@unique([loadId, state])
  @@index([loadId])
}

enum MileageSource {
  ROUTING_API     // AWS Location Services
  MANUAL          // dispatcher entered
  GPS             // future — ELD integration
}
```

### 12d. When to Calculate

- When stops are finalized on a load (all stops have addresses/coordinates)
- Recalculate if stops are reordered or changed
- Manual entry as fallback for loads without route data

### 12e. IFTA Report Query

```sql
-- Miles per state (from loads)
SELECT lsm.state, SUM(lsm.miles) as totalMiles
FROM LoadStateMiles lsm
JOIN Load l ON l.id = lsm.loadId
WHERE l.vehicleId = ? AND l.updatedAt BETWEEN ? AND ?
GROUP BY lsm.state

-- Fuel per state (from expenses)
SELECT e.state, SUM(e.gallons) as totalGallons, SUM(e.amount) as totalSpent
FROM Expense e
WHERE e.vehicleId = ? AND e.category = 'FUEL'
  AND e.fuelType = 'DIESEL'  -- DEF excluded from IFTA
  AND e.date BETWEEN ? AND ?
GROUP BY e.state
```

### 12f. Replacing Haversine

The existing `distanceCalculator.ts` uses Haversine (straight-line). AWS Location Services provides actual road distances. This should replace Haversine for:
- `totalMiles` on loads (accurate road distance)
- `deadheadMiles` calculation
- State-by-state breakdown (IFTA)

All three come from the same API call.

---

## 13. CPM — Estimated vs Actual

### 13a. Two Flavors

| CPM Type | Source | Use |
|---|---|---|
| **Estimated CPM** | `RecurringExpense` monthly totals / monthly miles target | Load-level quick estimation, minimum book rate, decision support |
| **Actual CPM** | Real `Expense` records / actual miles driven | P&L reporting, settlement accuracy, fleet dashboard |

### 13b. Load-Level `estimatedCost`

```
estimatedCost = CPM × totalMiles
```

- Before accounting module is live (no real expense data): uses Estimated CPM
- After accounting module has enough data: prefers Actual CPM with estimated as fallback
- Threshold for "enough data": configurable (e.g., 30+ expense entries for the vehicle)

### 13c. P&L Per Truck (Accounting Brief Screen 6)

Shows both side by side:

```
Actual CPM:    $1.10  (real expenses ÷ real miles)
Estimated CPM: $1.06  (recurring expenses ÷ target miles)
```

A significant gap signals unexpected costs (repairs, fuel spike) or inaccurate estimates.

### 13d. CPM Calculation Update

`calculateCpm` currently reads `TruckExpense`. After migration:

```typescript
// Estimated CPM (from recurring expense profile)
const estimatedCpm = calculateEstimatedCpm(vehicleId);
// → sum(RecurringExpense.amount) / vehicle.monthlyMilesTarget

// Actual CPM (from real expenses over a period)
const actualCpm = calculateActualCpm(vehicleId, periodStart, periodEnd);
// → sum(Expense.amount) / actual miles driven in period

// For load-level estimatedCost, prefer actual if available
const cpm = actualCpm ?? estimatedCpm;
```

---

## 14. API Response Changes

### 14a. LoadDetailResponse

```typescript
interface LoadFinancialFields {
  customerRate: string | null;
  carrierPayout: string | null;     // renamed from carrierRate
  companyMargin: string | null;     // renamed from dispatchFee
  driverPay: string | null;
  estimatedHours: string | null;
  estimatedCost: string | null;
  dispatcherComm: string | null;
  ratePerMile: string | null;

  // Derived in transformer (not stored):
  carrierRpm: string | null;         // carrierPayout / loadedMiles
  companyNet: string | null;         // varies by carrier type
  marginPercent: string | null;      // companyMargin / gross × 100
  estimatedNetEarnings: string | null; // carrierPayout - estimatedCost (driver/truck perspective)
}
```

### 14b. LoadListResponse

Add: `companyMargin`, `carrierPayout`, `companyNet` (derived).

### 14c. Backwards Compatibility

Breaking API change (field renames). UI updated in the same phase. No external API consumers.

---

## 15. Bug Fixes

### 15a. `updateLoad` Financial Staleness

**File:** `src/loads/services/loadService.ts`
**Fix:** After update, if financial-relevant fields changed and pre-dispatch, recalculate.

### 15b. `loadQueries.ts` Revenue Metric

**File:** `src/shared/loadQueries.ts:60`
**Fix:** Sum `customerRate` for total revenue, not `carrierRate`.

### 15c. Weekly Gross for Mixed Fleets

**File:** `src/loads/repositories/weeklyGrossQueryPrisma.ts`
**Fix:** Join to carrier. Sum `customerRate` for COMPANY_ASSET/LEASED_CARRIER, sum `companyMargin` for EXTERNAL_CARRIER.

### 15d. FinancialsCard Missing Key Metrics

**File:** `hussle-app-dispatch-ui/.../FinancialsCard/index.tsx`
**Fix:** Show `carrierPayout`, `companyMargin`, `driverPay`, `dispatcherComm`, `companyNet`, `estimatedNetEarnings`, `marginPercent`.

### 15e. UI/API `companyShare` Mismatch

**Fix:** Eliminated. Replaced by `companyNet` with clear, documented formula per carrier type.

---

## 16. Migration Strategy

All phases non-breaking — new fields nullable, renames via migration.

### Phase 1: Bug fixes (no schema changes)
- Fix `loadQueries.ts` revenue metric
- Fix `updateLoad` financial recalculation

### Phase 2: Schema migration
Single Prisma migration:
1. Add `LEASED_CARRIER` to `CarrierType` enum
2. Rename `carrierRate` → `carrierPayout` on Load
3. Rename `dispatchFee` → `companyMargin` on Load
4. Drop `partnerSplit` column on Load
5. Add `driverPay`, `estimatedHours`, `estimatedCost`, `dispatcherComm`, `dispatcherUserId` on Load
6. Add `payType`, `payRate` on Driver
7. Add `feeType`, `payFromNet` on Carrier
8. Add `DriverPayType`, `FeeType`, `DispatcherCommType`, `ExpenseSource`, `FuelType`, `Frequency`, `SettlementStatus`, `SettlementItemType`, `MileageSource`, `LoanType`, `LoanStatus` enums
9. Create `DispatcherProfile` model
10. Create `Expense` model (with fuel-specific nullable columns)
11. Create `RecurringExpense` model
12. Create `Settlement` + `SettlementLineItem` models
13. Create `LoadStateMiles` model
14. Create `Loan` + `LoanPayment` models (schema only, logic deferred)
15. Expand `ExpenseCategory` enum with granular categories

### Phase 3: Data migration
1. Parse `Driver.notes` JSON → populate `payType`/`payRate`
2. Migrate `TruckExpense` → `RecurringExpense`
3. Drop `TruckExpense` table
4. Backfill `carrierPayout` and `companyMargin` on existing loads
5. Update carrier portal to write new Driver columns

### Phase 4: Core calculation rewrite
1. Rewrite `calculateLoadFinancials` with carrier-type-aware logic
2. Wire into `createLoad`, `assignLoad`, `updateLoad`
3. Extend `accessorialSyncSubscriber` to recalculate load fields
4. Update transformers with new field names + derived fields
5. Update `calculateCpm` to use `RecurringExpense` / `Expense`

### Phase 5: Dispatcher commission
1. Create `DispatcherProfile` records
2. Wire commission calculation into financial flow
3. Add `dispatcherComm` to load response

### Phase 6: Expense tracking
1. Expense CRUD (create, list, update, delete)
2. Fuel entry with IFTA fields
3. RecurringExpense setup + auto-generation scheduler
4. Receipt upload (photo)

### Phase 7: Settlements
1. Settlement generation from delivered loads + expenses
2. Settlement workflow (DRAFT → APPROVED → PAID → DISPUTED)
3. Settlement PDF generation
4. Settlement list + detail views

### Phase 8: IFTA
1. AWS Location Services route calculation integration
2. State mileage extraction from route geometry
3. Replace Haversine with road distances
4. IFTA report generation (miles + fuel per state per quarter)

### Phase 9: UI updates
1. Update `FinancialsCard` with new fields
2. Update `DriverEconomicsSection` to use API-computed values
3. Update load list table columns
4. Update `LoadRateDrawer` for new field names
5. Accounting module screens (earnings dashboard, expense list, settlements, P&L, IFTA, fleet dashboard)

### Phase 10 (v2): Deferred features
1. Loan tracking + amortization
2. Bank/card import (Plaid)
3. Flat-fee carrier billing
4. Tiered dispatcher commission
5. Broker mode
6. Owner-operator carrier type

---

## 17. Open Questions

1. **Owner-operator carrier type:** When implemented, does it follow COMPANY_ASSET flow (company bears costs) or LEASED_CARRIER flow (separate entity, money flows through you)?

2. **Fuel cost estimation in API:** Should fuel price and MPG move from hardcoded UI constants to org/vehicle settings for more accurate `estimatedCost`?

3. **Flat-fee carrier billing:** Needs its own invoicing/billing flow separate from per-load. Design recurring carrier billing model before implementing.

4. **Brokerage mode:** Requires `BROKER` carrier type or load-level flag. `carrierPayout` becomes manually entered.

5. **Tiered dispatcher commission:** Volume brackets need month boundary definition (calendar month? rolling 30 days?).

6. **`partnerSplitPercent` on Carrier:** After dropping `partnerSplit` from Load, deprecate this column or repurpose for future co-broker use case?

7. **Historical load data:** Should we backfill `companyMargin` and `carrierPayout` on old loads using the new calculation, or only apply going forward?

8. **IFTA state boundary data:** Need a GeoJSON state boundary dataset for intersecting route polylines. Options: US Census TIGER/Line, Natural Earth, or a third-party IFTA-specific dataset.

9. **Settlement frequency:** Weekly is most common, but some carriers want bi-weekly or monthly. Should frequency be configurable per carrier?

10. **ExpenseCategory mapping:** The granular categories (FUEL, MAINTENANCE, etc.) need to map to CPM meta-categories (FIXED, VARIABLE, etc.) for CPM calculation. Where should this mapping live — application code or a config table?

11. **Per diem calculation:** The accounting brief's tax export includes per diem. Requires tracking days-away-from-home per driver. Data source: load dates + driver home base. Design needed.

---

## Appendix A: Implementation Details (Gap Resolutions)

### A1. `companyMargin` Semantics by Carrier Type

`companyMargin` means different things per carrier type:

| Carrier Type | companyMargin formula | What it means |
|---|---|---|
| COMPANY_ASSET | `gross - estimatedCost` | Profit margin (revenue minus operating costs) |
| LEASED_CARRIER | `feeBase × dispatchFeePercent / 100` | Your dispatch fee (service charge) |
| EXTERNAL_CARRIER | `feeBase × dispatchFeePercent / 100` | Your dispatch fee (service charge) |

For COMPANY_ASSET, `companyMargin` is **not** the same as the dispatch fee — it's the true profit margin after estimated costs. This makes `companyMargin` comparable across carrier types in the load list table:

```
Load    Carrier Type      Rate     Margin    Net
4521    COMPANY_ASSET    $3,200   $2,240    $1,920
4522    LEASED_CARRIER   $3,200     $320      $288
4523    EXTERNAL_CARRIER $3,200     $320      $288
```

**Updated calculation for COMPANY_ASSET (Section 6b):**

```
gross = customerRate + accessorials
carrierPayout = gross
companyMargin = gross - estimatedCost         // profit margin, not fee
estimatedCost = vehicleCpm × totalMiles
driverPay = calculateDriverPay(...)
dispatcherComm = calculateDispatcherComm(...)
companyNet = companyMargin - dispatcherComm    // margin minus commission
```

If `estimatedCost` is null (no CPM data), `companyMargin` is also null.

### A2. `dispatcherUserId` Assignment

**Manual assignment only.** The dispatcher explicitly selects who gets credit for the load.

- Not auto-set from the creator — the person entering the load may not be the dispatcher working it
- Not auto-set at dispatch — sometimes loads are set up by one person and dispatched by another
- Required before `dispatcherComm` can be calculated — if `dispatcherUserId` is null, commission is null
- Can be changed at any time pre-dispatch; frozen after dispatch (same as other financial fields)
- UI: dispatcher picker field on the load form and assignment drawer

### A3. Expense API Contract

**Endpoints:**

```
POST   /api/v1/expenses                    Create expense
GET    /api/v1/expenses                    List expenses (filtered)
GET    /api/v1/expenses/:id                Get expense detail
PATCH  /api/v1/expenses/:id                Update expense
DELETE /api/v1/expenses/:id                Delete expense (soft)
POST   /api/v1/expenses/:id/receipt        Get presigned upload URL for receipt
POST   /api/v1/expenses/:id/receipt/confirm Confirm receipt uploaded

GET    /api/v1/recurring-expenses          List recurring expenses for vehicle
POST   /api/v1/recurring-expenses          Create recurring expense
PATCH  /api/v1/recurring-expenses/:id      Update recurring expense
DELETE /api/v1/recurring-expenses/:id      Delete (deactivate)
```

**Query parameters for GET /expenses:**

```
vehicleId     required    UUID
driverId      optional    UUID
dateFrom      optional    ISO date
dateTo        optional    ISO date
category      optional    ExpenseCategory
hasReceipt    optional    boolean
source        optional    ExpenseSource
page          optional    number (default 1)
limit         optional    number (default 25)
sort          optional    'date' | 'amount' | 'category' (default 'date')
order         optional    'asc' | 'desc' (default 'desc')
```

**Permissions:**

| Role | Create | View | Edit | Delete | Approve |
|---|:---:|:---:|:---:|:---:|:---:|
| Driver (portal) | Own vehicle only | Own only | Own only (pre-approved) | No | No |
| Dispatcher | Any vehicle | All | All | All | Yes |
| Admin | Any vehicle | All | All | All | Yes |

**Fuel entry validation:** When `category = FUEL`, at least 2 of 3 fields required: `amount`, `gallons`, `pricePerGallon`. Third auto-calculated. `state` required for fuel entries (IFTA).

**Receipt upload:** Uses the same S3 presign flow as document uploads (`storageProvider.getPresignedPutUrl`). Storage key pattern: `{orgId}/expenses/{expenseId}/receipt.{ext}`. URL stored in `receiptUrl` field.

### A4. Settlement Generation

**Auto-draft (weekly):**

A scheduled job runs Sunday at 11:00 PM (configurable in org settings):

1. Query all drivers/carriers with delivered loads in the past week (Mon–Sun)
2. For each: generate DRAFT settlement with line items
3. Dispatchers see drafts Monday morning

**Infrastructure:** Uses `node-cron` (lightweight, in-process). Publishes a `settlement.generate` event to the RabbitMQ event bus. A subscriber handles the actual generation. This follows the existing subscriber pattern.

**Idempotency:** Before generating, check if a settlement already exists for this driver/carrier + period. Skip if one exists (regardless of status).

**Manual generation endpoint:**

```
POST /api/v1/settlements/generate
Body: {
  carrierId: string,
  driverId?: string,       // null for carrier-level settlements
  vehicleId?: string,
  periodStart: ISO date,
  periodEnd: ISO date
}
```

Returns the created settlement in DRAFT status.

**Settlement CRUD:**

```
GET    /api/v1/settlements                    List settlements (filtered)
GET    /api/v1/settlements/:id                Get settlement with line items
POST   /api/v1/settlements/generate           Generate new settlement
PATCH  /api/v1/settlements/:id/approve        Approve draft
PATCH  /api/v1/settlements/:id/pay            Record payment
PATCH  /api/v1/settlements/:id/dispute        Dispute (back to draft)
GET    /api/v1/settlements/:id/pdf            Download settlement PDF
```

### A5. LEASED_CARRIER Settlement — Expense Inclusion

**Configurable per carrier.** Add to Carrier model:

```prisma
includeExpensesOnSettlement  Boolean  @default(false)
```

- `false` (default): Settlement shows loads + dispatch fee deduction only. Carrier manages their own costs.
- `true`: Settlement includes expenses logged against the carrier's vehicle as deductions (fuel cards, maintenance accounts managed through you).

### A6. Invoice System Updates for LEASED_CARRIER

The invoice generation service (`invoiceGenerationService.ts` line 39) currently branches:

```typescript
const isCompanyAsset = carrierType === 'COMPANY_ASSET';
```

**Updated branching:**

```typescript
const generatesCustomerInvoice = carrierType === 'COMPANY_ASSET' || carrierType === 'LEASED_CARRIER';
const invoiceType = generatesCustomerInvoice ? 'CUSTOMER' : 'DISPATCH_FEE';
const subtotal = generatesCustomerInvoice ? customerRate : companyMargin;
const totalAmount = generatesCustomerInvoice ? subtotal.add(accessorialsTotal) : subtotal;
```

Both `invoiceGenerationService.ts` and `invoiceBuilderService.ts` need this update. LEASED_CARRIER generates a CUSTOMER invoice (billed to the customer/broker under your authority) — same as COMPANY_ASSET.

### A7. ExpenseCategory Enum Split

Remove meta-categories from the user-facing enum. Two separate enums:

```prisma
// User-facing — what drivers and dispatchers pick
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

**CPM grouping** defined in application code (not a DB enum):

```typescript
const CPM_CATEGORY_MAP: Record<ExpenseCategory, 'FIXED' | 'VARIABLE'> = {
  FUEL: 'VARIABLE',
  MAINTENANCE: 'VARIABLE',
  TOLLS: 'VARIABLE',
  PARKING: 'VARIABLE',
  MEALS: 'VARIABLE',
  INSURANCE: 'FIXED',
  TRUCK_PAYMENT: 'FIXED',
  TRAILER_RENTAL: 'FIXED',
  PERMITS_TAGS: 'FIXED',
  SCALES: 'VARIABLE',
  LUMPER: 'VARIABLE',
  TIRES: 'VARIABLE',
  OIL_CHANGE: 'VARIABLE',
  DEF_FLUID: 'VARIABLE',
  TRUCK_WASH: 'VARIABLE',
  ELD_SUBSCRIPTION: 'FIXED',
  PHONE: 'FIXED',
  LODGING: 'VARIABLE',
  FACTORING_FEE: 'FIXED',
  OTHER: 'VARIABLE',
};
```

The old meta-categories (FIXED, VARIABLE, SERVICE, WAGE, DEDUCTION) are removed from the enum. `calculateCpm` uses the mapping above to group actual expenses.

### A8. Recurring Expense Scheduler

**Library:** `node-cron` (add to dependencies)

**Pattern:** Follows the existing subscriber architecture:

1. `node-cron` job runs at configured time (default: 1st of month at midnight)
2. Publishes `recurring-expenses.generate` event to RabbitMQ
3. `RecurringExpenseGeneratorSubscriber` handles the event:
   - Queries all active `RecurringExpense` records
   - For each: checks `lastGeneratedAt` to prevent duplicates
   - Creates `Expense` record with `source = RECURRING` and `isRecurring = true`
   - Updates `lastGeneratedAt` on the RecurringExpense

**Add to RecurringExpense model:**

```prisma
lastGeneratedAt  DateTime?  // idempotency — skip if already generated this period
```

**Failure handling:** RabbitMQ retry (existing 3-retry pattern). If generation fails for one expense, others still process (independent iterations). Failures logged.

**Catch-up:** If the app was down during the scheduled time, the next startup checks for missed generations (compare `lastGeneratedAt` against current period).

### A9. AWS Location Services Integration

**API method:** `CalculateRoute` from `@aws-sdk/client-location`

**Flow:**

1. When stops are finalized (all have coordinates), call `CalculateRoute` with waypoints
2. Response includes `Legs[].Geometry.LineString` (route polyline) and `Legs[].Distance`
3. Use `@turf/turf` to intersect polyline with US state boundary polygons
4. Calculate miles per state segment
5. Store in `LoadStateMiles` table

**State boundary data:** US Census TIGER/Line simplified GeoJSON (~2MB). Loaded once at startup, cached in memory.

**Caching:** Hash the ordered stop coordinates. Same route = same state miles. Cache results in Redis with 30-day TTL.

**Cost:** AWS Location Services pricing: $0.50 per 1,000 route calculations. At 100 loads/day = ~$1.50/month.

**Error handling:**
- API timeout/failure: `LoadStateMiles` not created, `totalMiles` falls back to Haversine estimate, IFTA report shows warning
- International loads (Canada/Mexico): State miles only calculated for US segments
- Single-state loads: One `LoadStateMiles` row with all miles in that state

**Dependencies to add:** `@aws-sdk/client-location`, `@turf/turf`

### A10. Dashboard Query Updates

**Queries to rename:**

| Old query | New query | Change |
|---|---|---|
| `sumDispatchFeesInDateRange` | `sumCompanyMarginInDateRange` | Sums `companyMargin` instead of `dispatchFee` |
| `sumPartnerSplitInDateRange` | *Remove* | `partnerSplit` is dropped. Replace with `sumDriverPayInDateRange` if needed |

**New queries needed:**

```typescript
// Expense aggregations (for accounting dashboard)
sumExpensesByVehicle(vehicleId: string, dateFrom: Date, dateTo: Date): Promise<Decimal>;
sumExpensesByCategory(vehicleId: string, dateFrom: Date, dateTo: Date): Promise<CategoryBreakdown[]>;

// Settlement aggregations
countSettlementsByStatus(organizationId: string): Promise<Record<SettlementStatus, number>>;
sumPendingSettlements(organizationId: string): Promise<Decimal>;

// Fleet dashboard
getFleetPerformance(organizationId: string, dateFrom: Date, dateTo: Date): Promise<FleetPerformanceItem[]>;
// Returns per-vehicle: gross, expenses, net, CPM, loadCount, miles
```

**Weekly gross fix (Section 15c):** Join to carrier table:

```typescript
// COMPANY_ASSET + LEASED_CARRIER: sum customerRate (it's your revenue)
// EXTERNAL_CARRIER: sum companyMargin (only the fee is your revenue)
```

---

## Appendix B: Test Plan

### B1. Unit Tests — `calculateLoadFinancials`

**Test matrix (carrier type × scenario):**

| Test case | Carrier type | Key assertion |
|---|---|---|
| Basic company asset | COMPANY_ASSET | carrierPayout = gross, companyMargin = gross - estimatedCost |
| Company asset, no CPM | COMPANY_ASSET | companyMargin = null, companyNet = null |
| Company asset + accessorials | COMPANY_ASSET | gross includes accessorials |
| External carrier, basic fee | EXTERNAL_CARRIER | companyMargin = feeBase × %, carrierPayout = gross - margin |
| External carrier, fee includes accessorials | EXTERNAL_CARRIER | feeBase = customerRate + accessorials |
| External carrier, fee excludes accessorials | EXTERNAL_CARRIER | feeBase = customerRate only |
| Leased carrier | LEASED_CARRIER | Same calc as external, different settlement eligibility |
| Flat fee carrier (v2) | EXTERNAL_CARRIER | companyMargin = 0, carrierPayout = gross |
| Carrier payout override | EXTERNAL_CARRIER | Uses override instead of derived value |
| Null loadedMiles | Any | ratePerMile = null, carrierRpm = null |
| Zero customerRate | Any | All financials zero, no division errors |

### B2. Unit Tests — Driver Pay

| Test case | Pay type | Key assertion |
|---|---|---|
| Percentage of gross | PERCENTAGE | driverPay = carrierPayout × rate / 100 |
| Percentage of net (payFromNet) | PERCENTAGE | driverPay = (gross - estimatedCost) × rate / 100 |
| Per mile | PER_MILE | driverPay = rate × loadedMiles |
| Per mile, null miles | PER_MILE | driverPay = null |
| Per hour, manual hours | PER_HOUR | driverPay = rate × estimatedHours |
| Per hour, derived from appointments | PER_HOUR | estimatedHours auto-calculated |
| Per hour, no appointments | PER_HOUR | driverPay = null |
| Flat rate | FLAT_RATE | driverPay = rate (always) |
| No driver assigned | Any | driverPay = null |

### B3. Unit Tests — Dispatcher Commission

| Test case | Comm type | Key assertion |
|---|---|---|
| % of margin | PERCENTAGE_OF_MARGIN | comm = companyMargin × rate / 100 |
| % of gross | PERCENTAGE_OF_GROSS | comm = gross × rate / 100 |
| Flat per load | FLAT_PER_LOAD | comm = rate |
| No dispatcher assigned | Any | dispatcherComm = null |
| Null companyMargin | PERCENTAGE_OF_MARGIN | dispatcherComm = null |

### B4. Integration Tests — Recalculation

| Test case | Trigger | Verify |
|---|---|---|
| Create load with carrier | createLoad | All financial fields populated |
| Assign carrier to existing load | assignLoad | Financials recalculate |
| Change customerRate pre-dispatch | updateLoad | companyMargin, carrierPayout, ratePerMile update |
| Change customerRate post-dispatch | updateLoad | Rejected (frozen) |
| Add accessorial post-dispatch, feeIncludesAccessorials=true | accessorial.created | companyMargin, carrierPayout, driverPay (if %), dispatcherComm recalculate |
| Add accessorial post-dispatch, feeIncludesAccessorials=false | accessorial.created | Only invoice updates, load fields unchanged |
| Status → BOOKED | transitionStatus | Full recalculation |

### B5. Integration Tests — Settlements

| Test case | Verify |
|---|---|
| Generate settlement for company driver | Correct line items: loads, dispatch fee deductions, expenses |
| Generate settlement for leased carrier (expenses off) | Only loads + dispatch fee, no expenses |
| Generate settlement for leased carrier (expenses on) | Loads + dispatch fee + expenses |
| Duplicate generation for same period | Skipped (idempotent) |
| Approve settlement | Status → APPROVED, approvedAt set |
| Pay settlement | Status → PAID, payment details recorded |
| Dispute settlement | Status → DISPUTED → back to DRAFT |
| No delivered loads in period | Empty settlement not created |

---

## Appendix C: File Inventory (Rename Impact)

### Files requiring `carrierRate` → `carrierPayout` rename (19 files)

**API:**
- `prisma/schema.prisma` — column definition
- `src/loads/types/loadTypes.ts` — CreateLoadInput, UpdateLoadInput
- `src/loads/validators/loadValidators.ts` — create + update validators
- `src/loads/services/loadService.ts` — FINANCIAL_FIELDS constant
- `src/loads/controllers/transformers/loadTransformer.ts` — API response mapping
- `src/loads/__tests__/loadStatusService.test.ts` — test fixture
- `src/loads/services/__tests__/loadService.test.ts` — test fixture
- `src/places/controllers/transformers/loadAtFacilityTransformer.ts`
- `src/vehicles/controllers/transformers/loadHistoryTransformer.ts`
- `src/drivers/controllers/transformers/loadHistoryTransformer.ts`
- `src/shared/loadQueries.ts` — query select + metrics
- `src/invoices/types/invoiceTypes.ts`
- `src/invoices/repositories/invoiceRepositoryPrisma.ts`
- `prisma/seed.ts`

**UI:**
- `src/features/load/types.ts` — LoadListItem, LoadDetail, CreateLoadInput
- `src/features/load/validators/loadSchema.ts`
- `src/features/load/components/LoadRateDrawer/index.tsx`

### Files requiring `dispatchFee` → `companyMargin` rename (26 files)

**API:**
- `prisma/schema.prisma`
- `src/loads/types/loadTypes.ts`
- `src/loads/validators/loadValidators.ts`
- `src/loads/services/calculateFinancials.ts` — core calculation
- `src/loads/repositories/loadStatusRepositoryPrisma.ts` — updateFinancials
- `src/loads/types/loadStatusTypes.ts` — port interface
- `src/shared/financials.ts` — calculation function
- `src/shared/__tests__/financials.test.ts` — all test assertions
- `src/invoices/services/invoiceGenerationService.ts` — invoice branching
- `src/invoices/services/invoiceBuilderService.ts` — invoice branching
- `src/invoices/types/invoiceTypes.ts`
- `src/invoices/repositories/invoiceRepositoryPrisma.ts`
- `src/dashboard/types/dashboardTypes.ts` — KPI type
- `src/dashboard/repositories/dashboardQueryPrisma.ts` — aggregate query
- `src/dashboard/services/dashboardService.ts`
- `src/dashboard/controllers/transformers/dashboardTransformer.ts`
- `src/loads/controllers/transformers/loadTransformer.ts`
- `src/loads/__tests__/loadStatusService.test.ts`
- `prisma/seed.ts`

**UI:**
- `src/features/load/types.ts`
- `src/features/load/components/FinancialsCard/index.tsx`
- `src/features/load/pages/LoadDetailPage/tabs/FinancialsTab.tsx`
- `src/features/load/components/LoadRateDrawer/index.tsx`

### Files requiring `partnerSplit` removal (20 files)

Same files as `dispatchFee` rename (they appear together) plus:
- `src/dashboard/repositories/dashboardQueryPrisma.ts` — `sumPartnerSplitInDateRange` query removed
- `src/dashboard/types/dashboardTypes.ts` — `partnerSplitThisMonth` KPI removed

### Files requiring `companyShare` → `companyNet` (4 files)

- `src/shared/financials.ts` — calculation output
- `src/shared/__tests__/financials.test.ts` — test assertions
- UI `FinancialsCard/index.tsx` — display
- UI `FinancialsTab.tsx` — display
