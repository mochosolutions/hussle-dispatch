# Financial Model — Calculation Wiring Tasks
_Last updated: 2026-04-05 14:45_
_Plan: .planning/financial-model-calculations/plan.md_

---

## US-01: Wire vehicleCpm into financial calculation
_Priority: P0 | Services: dispatch-api | Status: todo_

**Acceptance Criteria:**
- [ ] `calculateAndPersistFinancials` queries RecurringExpense data for the load's vehicle
- [ ] vehicleCpm is computed via `calculateCpm` and passed to `calculateLoadFinancials`
- [ ] `estimatedCost` populates on loads where vehicle has RecurringExpense data and totalMiles is set
- [ ] `estimatedCost` is null when no RecurringExpense data exists for the vehicle
- [ ] `estimatedCost` is null when totalMiles is null

**Tasks:**
[x] T-01 [TYPES] Create VehicleCpmQueryPort and add to calculateAndPersistFinancials deps
         └─ Detail: In `src/loads/types/loadTypes.ts`, add a new port interface:
            ```
            export interface VehicleCpmQueryPort {
              getRecurringExpenses(vehicleId: string): Promise<{ amount: number; milesPerMonth: number }[]>;
            }
            ```
            In `src/loads/services/calculateFinancials.ts`:
            - Add `vehicleCpmQuery?: VehicleCpmQueryPort` to `CalculateAndPersistFinancialsDeps`
            - When `load.vehicleId` is non-null and `vehicleCpmQuery` is provided:
              1. Call `vehicleCpmQuery.getRecurringExpenses(load.vehicleId)`
              2. Pass result to `calculateCpm` from `src/shared/scoring/calculateCpm.ts` (reuse existing)
              3. Pass resulting number as `vehicleCpm` to `calculateLoadFinancials`
            - The `calculateLoadFinancials` function already accepts `vehicleCpm` and computes `estimatedCost = vehicleCpm * totalMiles` — no changes needed in `src/shared/financials.ts`
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-02 [API] Implement VehicleCpmQueryPort in Prisma repository
         └─ Detail: In `src/loads/repositories/loadRepositoryPrisma.ts` (or a new file `src/loads/repositories/vehicleCpmQueryPrisma.ts`), implement `VehicleCpmQueryPort`:
            - Query `prisma.recurringExpense.findMany({ where: { vehicleId, isActive: true } })`
            - RecurringExpense model has: `amount` (Decimal 10,2), `frequency` (Frequency enum), `vehicleId`
            - Need `monthlyMilesTarget` from Vehicle model: `prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { monthlyMilesTarget: true } })`
            - Map each RecurringExpense to `{ monthlyCost: Number(expense.amount), milesPerMonth: vehicle.monthlyMilesTarget ?? 0 }`
            - Return the array. `calculateCpm` handles deduplication of milesPerMonth values
         └─ Agent: backend
         └─ Depends on: T-01
         └─ Output:

[x] T-03 [WIRE] Wire VehicleCpmQuery into loads compositionRoot
         └─ Detail: In `src/loads/compositionRoot.ts`:
            - Instantiate the new vehicleCpmQuery repo
            - Pass it to all call sites of `calculateAndPersistFinancials` in `loadService` and `loadStatusService`
            - Three call sites in `loadService.ts` (lines ~615, ~717, ~771) and one in `loadStatusService.ts` (line ~52)
            - Each currently passes `{ load, loadStatusRepo, logger }` — add `vehicleCpmQuery` to deps
         └─ Agent: backend
         └─ Depends on: T-01, T-02
         └─ Output:

[x] T-04 [TEST] Unit tests for vehicleCpm integration
         └─ Detail: In `src/loads/services/__tests__/calculateFinancials.test.ts` (new file):
            - Test: when vehicle has RecurringExpense data and totalMiles is set → estimatedCost populates
            - Test: when no RecurringExpense data → estimatedCost is null (vehicleCpm = 0)
            - Test: when vehicleId is null → estimatedCost is null
            - Test: when totalMiles is null → estimatedCost is null
            - Mock `vehicleCpmQuery.getRecurringExpenses` and `loadStatusRepo.sumAccessorialCharges` / `loadStatusRepo.updateFinancials`
            - Verify `updateFinancials` is called with correct estimatedCost value
         └─ Agent: backend
         └─ Depends on: T-01, T-02, T-03
         └─ Output:

---

## US-02: Wire dispatcher commission into financial calculation
_Priority: P0 | Services: dispatch-api | Status: todo_

**Acceptance Criteria:**
- [ ] `calculateAndPersistFinancials` looks up DispatcherProfile for the load's dispatcherUserId
- [ ] Commission config (type + rate) passed to `calculateLoadFinancials`
- [ ] `dispatcherComm` populates on loads where dispatcherUserId is set and DispatcherProfile exists
- [ ] `dispatcherComm` is null when dispatcherUserId is null
- [ ] `companyNet` = companyMargin - dispatcherComm when both are non-null

**Tasks:**
[x] T-05 [TYPES] Create DispatcherProfileQueryPort and add to calculateAndPersistFinancials deps
         └─ Detail: In `src/loads/types/loadTypes.ts`, add:
            ```
            export interface DispatcherProfileQueryPort {
              findByUserId(userId: string, organizationId: string): Promise<{
                commissionType: string;
                commissionRate: string;
              } | null>;
            }
            ```
            In `src/loads/services/calculateFinancials.ts`:
            - Add `dispatcherProfileQuery?: DispatcherProfileQueryPort` to deps
            - Add `organizationId: string` to deps (needed for the query)
            - When `load.dispatcherUserId` is non-null and `dispatcherProfileQuery` is provided:
              1. Call `dispatcherProfileQuery.findByUserId(load.dispatcherUserId, organizationId)`
              2. If profile found, pass `{ commissionType, commissionRate }` as `dispatcherComm` input to `calculateLoadFinancials`
            - `calculateLoadFinancials` already accepts `dispatcherComm` input and computes the commission + companyNet
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-06 [API] Implement DispatcherProfileQueryPort in Prisma repository
         └─ Detail: Create `src/loads/repositories/dispatcherProfileQueryPrisma.ts`:
            - Implement `DispatcherProfileQueryPort`
            - DispatcherProfile is linked via Membership: `Membership.userId + Membership.organizationId` → `DispatcherProfile.membershipId`
            - Query: find Membership by userId + organizationId, include dispatcherProfile
            - If dispatcherProfile exists, return `{ commissionType, commissionRate: String(profile.commissionRate) }`
            - If not found, return null
            - Accept `PrismaClient | PrismaTransaction` as parameter (standard pattern)
         └─ Agent: backend
         └─ Depends on: T-05
         └─ Output:

[x] T-07 [WIRE] Wire DispatcherProfileQuery into loads compositionRoot
         └─ Detail: In `src/loads/compositionRoot.ts`:
            - Instantiate `dispatcherProfileQueryPrisma(prismaClient)`
            - Pass to all `calculateAndPersistFinancials` call sites alongside vehicleCpmQuery
            - Also pass `organizationId` from the load to the deps (available as `load.organizationId`)
            - Update all 4 call sites in loadService.ts and loadStatusService.ts
         └─ Agent: backend
         └─ Depends on: T-03, T-05, T-06
         └─ Output:

[x] T-08 [TEST] Unit tests for dispatcher commission integration
         └─ Detail: In `src/loads/services/__tests__/calculateFinancials.test.ts` (extend from T-04):
            - Test: when dispatcherUserId set and DispatcherProfile exists → dispatcherComm populates
            - Test: when dispatcherUserId is null → dispatcherComm is null
            - Test: when dispatcherUserId set but no DispatcherProfile → dispatcherComm is null
            - Test: PERCENTAGE_OF_MARGIN commission type → correct calculation
            - Test: FLAT_PER_LOAD commission type → correct calculation
            - Mock `dispatcherProfileQuery.findByUserId`
            - Verify `updateFinancials` called with correct dispatcherComm value
         └─ Agent: backend
         └─ Depends on: T-05, T-06, T-07
         └─ Output:

---

## US-03: Accessorial-driven financial recalculation
_Priority: P0 | Services: dispatch-api | Status: todo_

**Acceptance Criteria:**
- [ ] New subscriber listens to `accessorial.created`, `accessorial.updated`, `accessorial.deleted`
- [ ] Subscriber calls `calculateAndPersistFinancials` for the affected load
- [ ] Adding an accessorial to a dispatched load recalculates `companyMargin`, `carrierPayout`, `driverPay`, `dispatcherComm`
- [ ] `customerRate` and `estimatedCost` are NOT changed by accessorial recalculation (freeze rules)
- [ ] Both subscribers fire independently (invoice sync + financial recalc)

**Tasks:**
[x] T-09 [API] Create financialRecalcSubscriber
         └─ Detail: Create `src/loads/services/financialRecalcSubscriber.ts`:
            - Follow the exact pattern from `src/invoices/services/accessorialSyncSubscriber.ts`
            - Interface: `FinancialRecalcSubscriberDeps { eventBus: EventBus; loadRepo: Pick<LoadRepoPort, 'findById'>; loadStatusRepo: Pick<LoadStatusRepoPort, 'sumAccessorialCharges' | 'updateFinancials'>; vehicleCpmQuery: VehicleCpmQueryPort; dispatcherProfileQuery: DispatcherProfileQueryPort; logger: Logger; }`
            - Subscribe to `accessorial.created`, `accessorial.updated`, `accessorial.deleted` with queueGroup `'loads-financial-recalc'`
            - Handler: fetch load via `loadRepo.findById(data.loadId)` (need organizationId — use a findByIdWithoutScope or extract from the load)
            - If load has carrier and customerRate, call `calculateAndPersistFinancials`
            - Error handling: catch + log per event (same as accessorialSyncSubscriber)
            - Export `initializeFinancialRecalcSubscriber(deps): Promise<void>`
            Note: Freeze rules are handled naturally — `calculateLoadFinancials` recalculates all fields from current inputs. The `customerRate` stored on the load doesn't change. `estimatedCost` recalculates from `vehicleCpm * totalMiles` which also doesn't change from accessorial events. The "freeze" is inherent — accessorials only affect the accessorials total input.
         └─ Agent: backend
         └─ Depends on: T-03, T-07
         └─ Output:

[x] T-10 [WIRE] Wire financialRecalcSubscriber into loads compositionRoot
         └─ Detail: In `src/loads/compositionRoot.ts`:
            - Import `initializeFinancialRecalcSubscriber`
            - Add an `initializeSubscriber` function to the module's return value (same pattern as invoices compositionRoot)
            - Pass: eventBus, loadRepository (for findById — note: current findById requires organizationId, need a new repo method or adjust), loadStatusRepo, vehicleCpmQuery, dispatcherProfileQuery, logger
            - **Important:** `loadRepository.findById` requires `organizationId`. For the subscriber, we need to find the load by ID without org scoping. Options:
              a) Add a `findByIdUnscoped(id: string)` method to LoadRepoPort
              b) Use loadStatusRepo to get just the load ID's data
              Choose option (a) — add a simple findByIdUnscoped to the repo
            - In `src/app.ts`, call `loadsModule.initializeSubscriber()` alongside other subscriber inits
         └─ Agent: backend
         └─ Depends on: T-09
         └─ Output:

[x] T-11 [TEST] Unit tests for financial recalculation subscriber
         └─ Detail: In `src/loads/services/__tests__/financialRecalcSubscriber.test.ts` (new file):
            - Test: accessorial.created event → calculateAndPersistFinancials called for the load
            - Test: accessorial.deleted event → recalculation triggers
            - Test: load without carrier → skips recalculation (logs warning)
            - Test: load without customerRate → skips recalculation
            - Test: freeze rules — verify customerRate passed to calculation is the load's stored value (not modified)
            - Mock eventBus.subscribe, loadRepo, loadStatusRepo, vehicleCpmQuery, dispatcherProfileQuery
         └─ Agent: backend
         └─ Depends on: T-09, T-10
         └─ Output:

---

## US-04: Expose financial fields in load API responses
_Priority: P0 | Services: dispatch-api | Status: todo_

**Acceptance Criteria:**
- [ ] Load detail response includes stored fields: `carrierPayout`, `companyMargin`, `driverPay`, `estimatedHours`, `estimatedCost`, `dispatcherComm`
- [ ] Load detail response includes derived fields: `carrierRpm`, `companyNet`, `marginPercent`, `estimatedNetEarnings`
- [ ] `carrierRpm` = `carrierPayout / loadedMiles` (null if either null)
- [ ] `companyNet` = `companyMargin - dispatcherComm` (null if either null)
- [ ] `marginPercent` = `companyMargin / (customerRate + accessorials) × 100` (null if companyMargin null)
- [ ] `estimatedNetEarnings` = `carrierPayout - estimatedCost` (null if either null)
- [ ] Load list response includes `companyMargin`, `carrierPayout`, `companyNet`
- [ ] All derived fields use Decimal.js with banker's rounding to 2 decimal places

**Tasks:**
[x] T-12 [API] Add stored financial fields to loadTransformer detail response
         └─ Detail: In `src/loads/controllers/transformers/loadTransformer.ts`:
            - Add to `LoadDetailResponse` interface:
              `carrierPayout: string | null`, `companyMargin: string | null`, `driverPay: string | null`,
              `estimatedHours: string | null`, `estimatedCost: string | null`, `dispatcherComm: string | null`
            - Add to `toLoadDetailResponse` mapping:
              `carrierPayout: load.carrierPayout !== null ? String(load.carrierPayout) : null` (same pattern as customerRate)
              Same for companyMargin, driverPay, estimatedHours, estimatedCost, dispatcherComm
            - These fields already exist on the Load Prisma model (from financial-model-schema)
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-13 [API] Add derived financial fields to loadTransformer
         └─ Detail: In `src/loads/controllers/transformers/loadTransformer.ts`:
            - Import `Decimal` from `decimal.js`
            - Add to `LoadDetailResponse`:
              `carrierRpm: string | null`, `companyNet: string | null`,
              `marginPercent: string | null`, `estimatedNetEarnings: string | null`
            - Create helper: `computeDerivedFinancials(load: LoadWithRelations, accessorialCharges: AccessorialChargeResponse[])` that computes:
              - `carrierRpm`: if carrierPayout and loadedMiles non-null → `Decimal(carrierPayout).div(loadedMiles).toDP(2, Decimal.ROUND_HALF_EVEN).toFixed(2)`
              - `companyNet`: if companyMargin and dispatcherComm non-null → `Decimal(companyMargin).minus(dispatcherComm).toDP(2).toFixed(2)`
              - `marginPercent`: if companyMargin non-null and customerRate non-null → sum accessorialCharges amounts, gross = customerRate + accessorials, `Decimal(companyMargin).div(gross).times(100).toDP(2).toFixed(2)`
              - `estimatedNetEarnings`: if carrierPayout and estimatedCost non-null → `Decimal(carrierPayout).minus(estimatedCost).toDP(2).toFixed(2)`
            - Use Decimal.ROUND_HALF_EVEN for all rounding (banker's rounding, consistent with financials.ts)
         └─ Agent: backend
         └─ Depends on: T-12
         └─ Output:

[x] T-14 [API] Add financial fields to load list response
         └─ Detail: In `src/loads/controllers/transformers/loadTransformer.ts`:
            - Add to `LoadListItemResponse`: `companyMargin: string | null`, `carrierPayout: string | null`, `companyNet: string | null`
            - In `toLoadListItemResponse`:
              - `companyMargin: load.companyMargin !== null ? String(load.companyMargin) : null`
              - `carrierPayout: load.carrierPayout !== null ? String(load.carrierPayout) : null`
              - `companyNet`: derived — if companyMargin and dispatcherComm both non-null, compute. dispatcherComm is on the Load model.
            - Verify `LoadListItem` type in `loadTypes.ts` includes these fields (they should come from Prisma's `Load` model automatically since LoadListItem extends Load)
         └─ Agent: backend
         └─ Depends on: T-12
         └─ Output:

[x] T-15 [TEST] Unit tests for transformer derived fields
         └─ Detail: In `src/loads/controllers/transformers/__tests__/loadTransformer.test.ts` (new file):
            - Test: carrierRpm = carrierPayout / loadedMiles with banker's rounding
            - Test: carrierRpm is null when carrierPayout is null
            - Test: carrierRpm is null when loadedMiles is null or 0
            - Test: companyNet = companyMargin - dispatcherComm
            - Test: companyNet is null when either is null
            - Test: marginPercent = companyMargin / (customerRate + sum(accessorials)) × 100
            - Test: marginPercent is null when companyMargin is null
            - Test: estimatedNetEarnings = carrierPayout - estimatedCost
            - Test: estimatedNetEarnings is null when either is null
            - Test: load list response includes companyMargin, carrierPayout, companyNet
            - Build mock load objects matching LoadWithRelations shape
         └─ Agent: backend
         └─ Depends on: T-12, T-13, T-14
         └─ Output:

---

## US-05: estimatedHours auto-derivation (P1)
_Priority: P1 | Services: dispatch-api | Status: todo_

**Acceptance Criteria:**
- [ ] When driver payType is PER_HOUR and estimatedHours is not set, derive from first PICKUP appointmentStart to last DELIVERY appointmentStart
- [ ] If stop times are not available, estimatedHours stays null

**Tasks:**
[x] T-16 [API] Add estimatedHours auto-derivation to calculateAndPersistFinancials
         └─ Detail: In `src/loads/services/calculateFinancials.ts`:
            - When building `driverPayInput`, if `payType === 'PER_HOUR'` and `load.estimatedHours` is null:
              1. Find first PICKUP stop with appointmentStart from `load.stops`
              2. Find last DELIVERY stop with appointmentStart from `load.stops`
              3. If both exist, compute hours = (delivery.appointmentStart - pickup.appointmentStart) / (1000 * 60 * 60)
              4. Pass as `estimatedHours` in `driverPayInput`
            - If stops don't have appointment times, leave estimatedHours undefined (driverPay will be null for PER_HOUR — existing behavior)
            - Extract this logic into a small helper `deriveEstimatedHours(stops: Stop[]): number | undefined` within the same file
         └─ Agent: backend
         └─ Depends on: T-01
         └─ Output:

[x] T-17 [TEST] Unit tests for estimatedHours auto-derivation
         └─ Detail: In `src/loads/services/__tests__/calculateFinancials.test.ts` (extend):
            - Test: PER_HOUR driver with no estimatedHours but stops have appointments → hours derived
            - Test: PER_HOUR driver with estimatedHours already set → uses existing value
            - Test: PER_HOUR driver with no stop appointment times → estimatedHours stays undefined, driverPay is null
            - Test: Non-PER_HOUR driver → estimatedHours derivation not attempted
         └─ Agent: backend
         └─ Depends on: T-16
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[x] T-18 [VERIFY] Trace complete financial calculation flow
         └─ Detail: For each scenario, trace the full data flow:
            1. Load created with carrier + vehicle + dispatcherUserId → all financial fields populated
            2. Accessorial added post-dispatch → recalculation fires, freeze rules respected
            3. Dispatcher assigned via updateLoad → commission recalculated
            4. GET /loads/:id response → all stored + derived fields present
            5. GET /loads response → list fields present
            Check every AC from every story is satisfied by reading the implementation.
            Verify all event subscriptions are registered in composition roots.
            Verify all new ports are wired in composition root.
         └─ Agent: review
         └─ Depends on: T-04, T-08, T-11, T-15, T-17
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 4     | 4    | 0       | 5/5    |
| US-02 | 4     | 4    | 0       | 5/5    |
| US-03 | 3     | 3    | 0       | 5/5    |
| US-04 | 4     | 4    | 0       | 8/8    |
| US-05 | 2     | 2    | 0       | 2/2    |
| VER-01| 1     | 1    | 0       | —      |
| **All** | **18** | **18** | **0** | **25/25** |
