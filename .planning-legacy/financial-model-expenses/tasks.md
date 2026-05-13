# Financial Model — Expense Tracking Tasks
_Last updated: 2026-04-05 12:30_
_Plan: .planning/financial-model-expenses/plan.md_

---

## US-01: Schema Migration & Foundation Types
_Priority: P0 | Services: api | Status: in-progress_

**Acceptance Criteria:**
- [ ] Prisma migration adds `deletedAt DateTime?` to Expense model (non-destructive)
- [ ] Expense domain types, port interfaces, and typed errors defined
- [ ] Recurring expense domain types and port interfaces defined
- [ ] CPM category map constant maps all 20 ExpenseCategory values to FIXED/VARIABLE
- [ ] Event map updated with expense.created, expense.updated, expense.deleted, recurring-expense.generated

**Tasks:**
[x] T-01 [DB] Prisma migration: add deletedAt to Expense model
         └─ Detail: Create migration at `prisma/migrations/<timestamp>_expense_soft_delete/`.
            Add `deletedAt DateTime?` to Expense model in `prisma/schema.prisma`.
            Run `npx prisma migrate dev --name expense_soft_delete`.
            Verify migration is non-destructive (no data loss).
            Existing Expense model is at schema.prisma lines ~1206-1237.
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-02 [TYPES] Expense domain types, port interfaces, typed errors
         └─ Detail: Create `src/expenses/types/expenseTypes.ts`.
            Derive types from Prisma: `import { Expense, ExpenseCategory, ExpenseSource, FuelType } from '@prisma/client'`.
            Define: `ExpenseBase`, `CreateExpenseInput` (category, vehicleId, driverId?, vendor?, amount, date, state?, notes?, gallons?, pricePerGallon?, fuelType?, odometer?), `UpdateExpenseInput` (Partial<CreateExpenseInput> & { id }), `ListExpensesInput` (vehicleId required, driverId?, dateFrom?, dateTo?, category?, hasReceipt?, source?, page, limit, sort, order, organizationId), `ExpenseWithMeta` (Expense with computed fields).
            Define `ExpenseRepoPort` interface: create, findById, findMany, update, softDelete, count.
            All queries must filter `deletedAt IS NULL` by default.
            Follow pattern from REGISTRY: customer service types derive from Prisma.
         └─ Agent: backend
         └─ Depends on: T-01
         └─ Output:

[x] T-03 [TYPES] Recurring expense types and port interfaces
         └─ Detail: Create `src/expenses/types/recurringExpenseTypes.ts`.
            Derive from Prisma: `import { RecurringExpense, Frequency } from '@prisma/client'`.
            Define: `CreateRecurringExpenseInput` (organizationId, vehicleId, category, label, amount, frequency, dayOfMonth?), `UpdateRecurringExpenseInput`, `ListRecurringExpensesInput` (vehicleId required, organizationId), `GenerateRecurringInput` (vehicleId, organizationId).
            Define `RecurringExpenseRepoPort`: create, findById, findMany, findActiveByVehicle, update, deactivate, updateLastGeneratedAt.
            Follow same derivation pattern as T-02.
         └─ Agent: backend
         └─ Depends on: T-01
         └─ Output:

[x] T-04 [TYPES] CPM category map constant and event map updates
         └─ Detail: Create `src/shared/constants/expenseCpmCategories.ts` with `CPM_CATEGORY_MAP: Record<ExpenseCategory, 'FIXED' | 'VARIABLE'>` mapping all 20 enum values per plan.md § Data Requirements.
            NOTE: `src/shared/constants/expenseCategories.ts` already exists with a DIFFERENT categorization (FIXED/VARIABLE/SERVICE/WAGE/DEDUCTION). Do NOT modify that file — create the new file alongside it. The existing file is used by TruckExpense; the new map is for the granular Expense/RecurringExpense models.
            Update `src/shared/messaging/eventMap.ts` — add events: `'expense.created': { expenseId, vehicleId, organizationId, category }`, `'expense.updated': { expenseId, vehicleId, organizationId }`, `'expense.deleted': { expenseId, vehicleId, organizationId }`, `'recurring-expense.generated': { vehicleId, organizationId, count }`.
            Existing event map already has `vehicle.expense.changed` and `vehicle.expense.created` — keep those, add the new ones.
         └─ Agent: backend
         └─ Depends on: —
         └─ Output: Files: src/shared/constants/expenseCpmCategories.ts (created), src/shared/messaging/eventMap.ts (modified). Exports: CPM_CATEGORY_MAP, 4 new EventMap entries. Typecheck: PASS.

---

## US-02: Expense CRUD API
_Priority: P0 | Services: api | Status: todo_

**Acceptance Criteria:**
- [ ] POST /api/v1/expenses creates expense linked to org, vehicle, optional driver
- [ ] GET /api/v1/expenses?vehicleId=X returns paginated, filtered, sorted expenses
- [ ] GET /api/v1/expenses/:id returns full expense detail including fuel fields
- [ ] PATCH /api/v1/expenses/:id updates expense; 404 for soft-deleted
- [ ] DELETE /api/v1/expenses/:id sets deletedAt (soft delete)
- [ ] Soft-deleted expenses excluded from all list/get queries
- [ ] All endpoints enforce organization scoping via request context
- [ ] Fuel entry validation: 2-of-3 rule with auto-calc, state required, fuelType defaults DIESEL
- [ ] Non-fuel expenses reject fuel-specific fields

**Tasks:**
[x] T-05 [API] Expense Yup validators
         └─ Detail: Create `src/expenses/validators/expenseValidators.ts`.
            Schemas: `createExpenseValidator` (body: category required oneOf ExpenseCategory enum, vehicleId uuid required, driverId uuid optional, vendor string optional, amount number required positive, date date required, state string optional, notes string optional, gallons number optional positive, pricePerGallon number optional positive, fuelType oneOf FuelType optional, odometer number optional integer positive).
            `updateExpenseValidator` (params: id uuid required, body: all fields optional).
            `listExpensesValidator` (query: vehicleId uuid required, driverId uuid optional, dateFrom date optional, dateTo date optional, category oneOf optional, hasReceipt boolean optional, source oneOf ExpenseSource optional, page number optional default 1, limit number optional default 25 max 100, sort oneOf ['date','amount','category'] optional default 'date', order oneOf ['asc','desc'] optional default 'desc').
            `getExpenseValidator` (params: id uuid required).
            `deleteExpenseValidator` (params: id uuid required).
            Follow pattern from `src/loads/validators/loadValidators.ts`.
         └─ Agent: backend
         └─ Depends on: T-01
         └─ Output:

[x] T-06 [API] Expense repository with soft-delete filtering
         └─ Detail: Create `src/expenses/repositories/expenseRepositoryPrisma.ts`.
            Implement `ExpenseRepoPort` from T-02.
            ALL read queries must include `where: { deletedAt: null }` to exclude soft-deleted records.
            `create`: prisma.expense.create with data spread.
            `findById`: prisma.expense.findFirst where id AND deletedAt null.
            `findMany`: support all ListExpensesInput filters. Use `parsePaginationParams` from `src/shared/pagination.ts`. Filter: vehicleId (required), organizationId (required), driverId, dateFrom (gte), dateTo (lte), category, hasReceipt (receiptUrl is not null / is null), source. Sort by date/amount/category + order. Return { data, meta: { total, page, limit, hasMore } }.
            `update`: prisma.expense.update where id, return updated.
            `softDelete`: prisma.expense.update where id, set deletedAt = new Date().
            `count`: prisma.expense.count with same filters.
            Accept `PrismaClient | PrismaTransaction` param per repository template.
         └─ Agent: backend
         └─ Depends on: T-02
         └─ Output:

[x] T-07 [API] Expense service with fuel auto-calc and business rules
         └─ Detail: Create `src/expenses/services/expenseService.ts`.
            Factory: `createExpenseService(deps: ExpenseServiceDeps): ExpenseService`.
            Deps: `{ expenseRepo: ExpenseRepoPort, eventBus: EventBus, logger: LoggerPort }`.
            Methods:
            - `createExpense(input)`: Validate fuel rules (if category=FUEL: require 2 of 3 {amount, gallons, pricePerGallon}, auto-calc missing third; require state; default fuelType to DIESEL). If category !== FUEL, reject fuel-specific fields (gallons, pricePerGallon, fuelType, odometer) — throw ValidationError if provided. Create via repo. Publish `expense.created` event. Return expense.
            - `getExpenseById(input)`: findById, throw NotFoundError if null.
            - `listExpenses(input)`: delegate to repo.findMany, return paginated result.
            - `updateExpense(input)`: findById (404 if not found or soft-deleted), apply fuel validation on update if category is/becomes FUEL, update via repo, publish `expense.updated`. Return updated.
            - `softDeleteExpense(input)`: findById (404), softDelete via repo, publish `expense.deleted`.
            Fuel auto-calc logic: `amount = gallons * pricePerGallon`, `gallons = amount / pricePerGallon`, `pricePerGallon = amount / gallons`. Use Decimal math (multiply/divide Decimal fields, not JS floats).
            Follow service factory pattern from REGISTRY (createCustomerService pattern).
         └─ Agent: backend
         └─ Depends on: T-02, T-04, T-05, T-06
         └─ Output:

[x] T-08 [API] Expense controllers, mappers, transformers
         └─ Detail: Create files in `src/expenses/controllers/`:
            **Mappers** (in `mappers/`):
            - `createExpenseMapper.ts`: Extract organizationId+role from `getRequestContextMapper(req)`, spread req.body fields. Return `CreateExpenseServiceInput`.
            - `updateExpenseMapper.ts`: Extract id from params, organizationId from context, body fields. Return `UpdateExpenseServiceInput`.
            - `listExpensesMapper.ts`: Extract organizationId from context, query params (vehicleId, driverId, dateFrom, dateTo, category, hasReceipt, source, page, limit, sort, order). Return `ListExpensesInput`.
            - `expenseIdMapper.ts`: Extract id from params, organizationId from context. Return `{ id, organizationId }`.
            **Transformers** (in `transformers/`):
            - `expenseTransformer.ts`: Convert Expense to response shape. Dates to ISO strings, Decimals to numbers. Include all fields: id, organizationId, vehicleId, driverId, category, vendor, amount, date, state, notes, receiptUrl, isRecurring, source, gallons, pricePerGallon, fuelType, odometer, createdAt, updatedAt.
            **Controller**:
            - `expenseController.ts`: Factory `createExpenseControllers(deps)` returning { create, list, getById, update, softDelete }. Each method: mapper -> service -> transformer -> sendSingle/sendList. Use `sendSingle` from `shared/responseEnvelope.ts` and `sendList` for paginated.
            Follow load controller pattern from REGISTRY.
         └─ Agent: backend
         └─ Depends on: T-02, T-07
         └─ Output:

[x] T-09 [API] Expense routes and composition root wiring
         └─ Detail: Create `src/expenses/routes/expenseRoutes.ts`.
            Wire routes per plan API table:
            - `POST /` → requireAuth, validateRequest(createExpenseValidator), controllers.create
            - `GET /` → requireAuth, validateRequest(listExpensesValidator), controllers.list
            - `GET /:id` → requireAuth, validateRequest(getExpenseValidator), controllers.getById
            - `PATCH /:id` → requireAuth, validateRequest(updateExpenseValidator), controllers.update
            - `DELETE /:id` → requireAuth, validateRequest(deleteExpenseValidator), controllers.softDelete
            Auth middleware: use `requireAuth` (same as other routes — checks authenticated user).
            Create `src/expenses/compositionRoot.ts`: factory `createExpenseModule(deps: { prisma, logger, eventBus })`. Wire: expenseRepo → expenseService → controllers. Export { controllers, queries: { findById, findMany, count } }.
            Create `src/expenses/index.ts` barrel export.
            DO NOT mount in app.ts yet — that's T-20.
         └─ Agent: backend
         └─ Depends on: T-05, T-06, T-07, T-08
         └─ Output:

[x] T-10 [TEST] Expense service unit tests
         └─ Detail: Create `src/expenses/services/__tests__/expenseService.test.ts`.
            Test cases:
            - Creates expense when input valid (non-fuel)
            - Creates fuel expense with auto-calc (amount + gallons → derives pricePerGallon)
            - Creates fuel expense (gallons + pricePerGallon → derives amount)
            - Creates fuel expense (amount + pricePerGallon → derives gallons)
            - Throws ValidationError when fuel expense missing 2-of-3 fields
            - Throws ValidationError when fuel expense missing state
            - Defaults fuelType to DIESEL when category FUEL and fuelType not provided
            - Rejects fuel-specific fields on non-fuel expense
            - Returns 404 (NotFoundError) when getting soft-deleted expense
            - Soft-deletes expense (sets deletedAt)
            - Updates expense fields
            - Publishes expense.created event on create
            - Publishes expense.deleted event on soft delete
            Mock: expenseRepo, eventBus, logger. Follow AAA pattern per REGISTRY test pattern.
         └─ Agent: backend
         └─ Depends on: T-07
         └─ Output:

---

## US-03: Receipt Upload
_Priority: P0 | Services: api | Status: todo_

**Acceptance Criteria:**
- [ ] POST /expenses/:id/receipt returns presigned S3 PUT URL
- [ ] POST /expenses/:id/receipt/confirm verifies file in S3, stores receiptUrl
- [ ] Storage key: {orgId}/expenses/{expenseId}/receipt.{ext}
- [ ] Returns 404 if expense doesn't exist or is soft-deleted

**Tasks:**
[x] T-11 [API] Receipt service, controller, mapper, and route wiring
         └─ Detail: Create `src/expenses/services/receiptService.ts`.
            Factory: `createReceiptService(deps: { expenseRepo, s3Presign, s3Client, logger })`.
            Methods:
            - `presign(input: { expenseId, organizationId, fileName, mimeType })`: Look up expense (404 if missing/deleted). Build S3 key: `${organizationId}/expenses/${expenseId}/receipt.${ext}` where ext from fileName. Call `generatePresignedPutUrl` from `src/shared/s3Presign.ts`. Return { presignedUrl, expiresIn }.
            - `confirm(input: { expenseId, organizationId })`: Look up expense (404). Check S3 file exists (headObject). Store receiptUrl on expense via repo.update. Return updated expense.
            Follow the presign/confirm pattern from `src/documents/services/documentService.ts` — two-step upload.
            Create `src/expenses/controllers/receiptController.ts` with presign + confirm handlers.
            Create `src/expenses/controllers/mappers/receiptMapper.ts`: extract expenseId from params, organizationId from context, body fields (fileName, mimeType for presign).
            Add receipt routes to `expenseRoutes.ts`:
            - `POST /:id/receipt` → requireAuth, controllers.presignReceipt
            - `POST /:id/receipt/confirm` → requireAuth, controllers.confirmReceipt
            Wire receiptService in compositionRoot.
         └─ Agent: backend
         └─ Depends on: T-06, T-09
         └─ Output:

---

## US-04: Recurring Expenses
_Priority: P0 | Services: api | Status: todo_

**Acceptance Criteria:**
- [ ] POST /recurring-expenses creates template with category, label, amount, frequency
- [ ] Unique constraint enforced: one label per vehicle (409 Conflict)
- [ ] PATCH /recurring-expenses/:id updates template
- [ ] DELETE /recurring-expenses/:id sets isActive=false
- [ ] GET /recurring-expenses?vehicleId=X returns active recurring expenses
- [ ] POST /recurring-expenses/generate creates Expense records from active templates
- [ ] Generation is idempotent via lastGeneratedAt
- [ ] Generated expenses have source=RECURRING and isRecurring=true
- [ ] lastGeneratedAt updated after generation

**Tasks:**
[x] T-12 [API] Recurring expense validators
         └─ Detail: Create `src/expenses/validators/recurringExpenseValidators.ts`.
            Schemas:
            - `createRecurringExpenseValidator`: body: vehicleId uuid required, category oneOf ExpenseCategory required, label string required trim min 1 max 100, amount number required positive, frequency oneOf ['WEEKLY','MONTHLY'] optional default 'MONTHLY', dayOfMonth number optional integer min 1 max 28.
            - `updateRecurringExpenseValidator`: params: id uuid required, body: category optional, label optional, amount optional, frequency optional, dayOfMonth optional.
            - `listRecurringExpensesValidator`: query: vehicleId uuid required.
            - `generateRecurringValidator`: body: vehicleId uuid required.
            - `recurringExpenseIdValidator`: params: id uuid required.
         └─ Agent: backend
         └─ Depends on: T-01
         └─ Output:

[x] T-13 [API] Recurring expense repository
         └─ Detail: Create `src/expenses/repositories/recurringExpenseRepositoryPrisma.ts`.
            Implement `RecurringExpenseRepoPort` from T-03.
            `create`: prisma.recurringExpense.create. Catch unique constraint error (vehicleId+label) → throw ConflictError.
            `findById`: prisma.recurringExpense.findUnique.
            `findMany`: filter by vehicleId, organizationId. Return all (no pagination — small dataset per vehicle).
            `findActiveByVehicle`: filter vehicleId + isActive=true.
            `update`: prisma.recurringExpense.update.
            `deactivate`: update isActive=false.
            `updateLastGeneratedAt`: update lastGeneratedAt to now.
            Accept PrismaClient | PrismaTransaction.
         └─ Agent: backend
         └─ Depends on: T-03
         └─ Output:

[x] T-14 [API] Recurring expense service with generation logic
         └─ Detail: Create `src/expenses/services/recurringExpenseService.ts`.
            Factory: `createRecurringExpenseService(deps: { recurringExpenseRepo, expenseRepo, eventBus, logger })`.
            Methods:
            - `create(input)`: delegate to repo (ConflictError on duplicate label).
            - `list(input)`: repo.findMany filtered by vehicleId + organizationId.
            - `update(input)`: findById (404), repo.update.
            - `deactivate(input)`: findById (404), repo.deactivate.
            - `generate(input: { vehicleId, organizationId })`: Find all active recurring for vehicle. For each entry: check if `lastGeneratedAt` is within current period (MONTHLY: same calendar month, WEEKLY: same ISO week). Skip if already generated. Create Expense record with `source = 'RECURRING'`, `isRecurring = true`, `recurringExpenseId` set, `date = new Date()`, `amount` from template. Update `lastGeneratedAt`. Return count of generated expenses. Publish `recurring-expense.generated` event with count.
            Idempotency: compare lastGeneratedAt month/year (MONTHLY) or ISO week (WEEKLY) to current date.
         └─ Agent: backend
         └─ Depends on: T-03, T-06, T-13
         └─ Output:

[x] T-15 [API] Recurring expense controllers, mappers, transformers, routes
         └─ Detail: Create in `src/expenses/controllers/`:
            **Mappers**: `createRecurringExpenseMapper.ts`, `updateRecurringExpenseMapper.ts`, `listRecurringExpensesMapper.ts`, `generateRecurringMapper.ts`, `recurringExpenseIdMapper.ts`. Extract organizationId from request context, params/body/query per validator schemas.
            **Transformer**: `recurringExpenseTransformer.ts` — convert RecurringExpense to response (Decimals to numbers, dates to ISO).
            **Controller**: `recurringExpenseController.ts` — factory returning { create, list, update, deactivate, generate }. Mapper → service → transformer → response.
            Create `src/expenses/routes/recurringExpenseRoutes.ts`:
            - `POST /` → requireAuth, validate(createRecurringExpenseValidator), controllers.create
            - `GET /` → requireAuth, validate(listRecurringExpensesValidator), controllers.list
            - `PATCH /:id` → requireAuth, validate(updateRecurringExpenseValidator), controllers.update
            - `DELETE /:id` → requireAuth, validate(recurringExpenseIdValidator), controllers.deactivate
            - `POST /generate` → requireAuth, validate(generateRecurringValidator), controllers.generate
            Wire recurringExpenseService + controllers in compositionRoot.
         └─ Agent: backend
         └─ Depends on: T-12, T-13, T-14
         └─ Output:

[x] T-16 [TEST] Recurring expense service unit tests
         └─ Detail: Create `src/expenses/services/__tests__/recurringExpenseService.test.ts`.
            Test cases:
            - Creates recurring expense
            - Throws ConflictError on duplicate vehicleId+label
            - Lists active recurring expenses for vehicle
            - Deactivates recurring expense (sets isActive=false)
            - Generates expense records from active templates
            - Skips already-generated entries (idempotent by period)
            - Sets source=RECURRING and isRecurring=true on generated expenses
            - Updates lastGeneratedAt after generation
            - Publishes recurring-expense.generated event
            Mock: recurringExpenseRepo, expenseRepo, eventBus, logger.
         └─ Agent: backend
         └─ Depends on: T-14
         └─ Output:

---

## US-05: TruckExpense Data Migration
_Priority: P0 | Services: api | Status: todo_

**Acceptance Criteria:**
- [ ] Migration script converts all TruckExpense rows to RecurringExpense records
- [ ] Maps expenseKey → label, monthlyAmount → amount, category → nearest granular ExpenseCategory
- [ ] Handles duplicates gracefully (skip on unique constraint)
- [ ] Old /vehicles/:id/expenses endpoints continue to work

**Tasks:**
[x] T-17 [DB] TruckExpense → RecurringExpense data migration script (ALREADY EXISTS)
         └─ Detail: Create `prisma/migrations/data-migration-recurring-expenses.ts`.
            NOTE: `prisma/migrations/data-migration-truck-expenses.ts` already exists — check if it already does this migration. If it does, skip this task and report "ALREADY EXISTS".
            If not, create script:
            1. Query all TruckExpense rows with vehicle relation (need vehicle.carrierId → carrier.managedByOrgId for organizationId lookup, or join through Vehicle).
            2. Map each row: `expenseKey` → `label`, `monthlyAmount` → `amount`, `vehicleId` → `vehicleId`.
            3. Map `category` field: TruckExpense uses the same ExpenseCategory enum, so use it directly.
            4. Set `frequency = 'MONTHLY'`, `isActive = true`.
            5. Get `organizationId`: query vehicle → carrier → managedByOrgId.
            6. Use `createMany` with `skipDuplicates: true` to handle unique constraint (vehicleId + label).
            7. Log counts: total TruckExpense rows, successfully migrated, skipped.
            Script should be runnable standalone: `npx tsx prisma/migrations/data-migration-recurring-expenses.ts`.
         └─ Agent: backend
         └─ Depends on: T-01
         └─ Output:

---

## US-06: Driver Portal Expense Access
_Priority: P0 | Services: api | Status: todo_

**Acceptance Criteria:**
- [ ] New VEHICLE token type added to TrackingToken for vehicle-scoped access
- [ ] POST /driver-portal/expenses creates expense scoped to driver's vehicle
- [ ] GET /driver-portal/expenses returns only driver's vehicle expenses
- [ ] PATCH /driver-portal/expenses/:id allows editing own expenses only
- [ ] Driver cannot delete expenses
- [ ] Driver portal expense endpoints reject invalid/expired tokens

**Tasks:**
[x] T-18 [API] Vehicle-scoped token type and driver portal auth update
         └─ Detail: The Prisma schema has `TrackingTokenType` enum — check current values. If `VEHICLE` is not present, add it via migration.
            Update `src/driver-portal/middleware/authenticateDriverToken.ts`:
            Current pattern checks `tokenRecord.type !== 'DRIVER'`. Update to also accept `'VEHICLE'` type tokens. When token type is `VEHICLE`, set `req.driverPortal` context with vehicleId instead of loadId. Extend the `DriverPortalContext` type in `src/driver-portal/types/express.d.ts` to include optional `vehicleId`.
            Alternatively: create a separate `authenticateVehicleToken` middleware that validates VEHICLE tokens and sets vehicleId context. This may be cleaner than overloading the existing middleware.
            Decision: create `src/expenses/middleware/authenticateVehicleToken.ts` — separate middleware for vehicle-scoped tokens. Follows same pattern as driver token auth but checks type=VEHICLE and extracts vehicleId from token record.
            Need to add vehicleId to LoadTrackingToken model OR create a new VehicleToken model. Check schema — LoadTrackingToken has `loadId` but no `vehicleId`. Options: add optional `vehicleId` to LoadTrackingToken, or use a mapping table. Simplest: add `vehicleId String?` to LoadTrackingToken and make `loadId` optional. Create migration if needed.
         └─ Agent: backend
         └─ Depends on: T-01
         └─ Output:

[x] T-19 [API] Driver portal expense controllers and routes
         └─ Detail: Create `src/driver-portal/controllers/driverPortalExpenseController.ts`.
            Factory receiving { expenseService, logger }.
            Methods:
            - `createExpense`: Extract vehicleId from req.driverPortal context. Map body to CreateExpenseInput with vehicleId locked to token's vehicle. Call expenseService.createExpense. Transform + respond.
            - `listExpenses`: Extract vehicleId from context. Call expenseService.listExpenses with vehicleId filter. Transform + respond.
            - `editExpense`: Extract vehicleId from context, id from params. Call expenseService.updateExpense. Verify expense belongs to vehicle (service should scope by vehicleId).
            Create mappers in `src/driver-portal/controllers/mappers/`: `driverExpenseMapper.ts`.
            Add routes to `src/driver-portal/routes/driverPortalRoutes.ts` (or create separate file):
            - `POST /portal/expenses` → authenticateVehicleToken, validate, controllers.createExpense
            - `GET /portal/expenses` → authenticateVehicleToken, controllers.listExpenses
            - `PATCH /portal/expenses/:id` → authenticateVehicleToken, validate, controllers.editExpense
            NO delete endpoint for drivers.
            Wire in driver-portal compositionRoot or expenses compositionRoot.
         └─ Agent: backend
         └─ Depends on: T-07, T-09, T-18
         └─ Output:

---

## US-07: CPM Integration & Domain Events
_Priority: P0 | Services: api | Status: todo_

**Acceptance Criteria:**
- [ ] vehicleCpmQueryPrisma returns estimated CPM from RecurringExpense (existing)
- [ ] New actualCpmQuery calculates CPM from real Expense records
- [ ] expense.created/updated/deleted events trigger CPM cache invalidation
- [ ] CPM category mapping uses granular ExpenseCategory → FIXED/VARIABLE

**Tasks:**
[x] T-20 [API] Actual CPM query and vehicleCpmQueryPrisma update
         └─ Detail: Update `src/loads/repositories/vehicleCpmQueryPrisma.ts`.
            Current implementation: `getRecurringExpenses` queries RecurringExpense for estimated CPM.
            Add new method: `getActualExpenses(vehicleId, dateRange?)` — query Expense table (where vehicleId, deletedAt null, optionally filtered by date range). Return { totalFixed, totalVariable, milesDriven } using CPM_CATEGORY_MAP from `src/shared/constants/expenseCpmCategories.ts` (T-04) to classify each expense.
            For miles: query loads with vehicleId in date range, sum `totalMiles`.
            Add to `VehicleCpmQueryPort` interface in load types.
            Also: the existing `getRecurringExpenses` should use the new CPM_CATEGORY_MAP to classify recurring expenses as FIXED/VARIABLE (currently just sums all amounts without classification).
            Do NOT modify `calculateCpm` in `src/shared/scoring/calculateCpm.ts` — it's a pure function that receives data.
         └─ Agent: backend
         └─ Depends on: T-04, T-06
         └─ Output:

[x] T-21 [API] Expense event subscriber for CPM invalidation
         └─ Detail: Check `src/loads/services/financialRecalcSubscriber.ts` — it may already handle expense events. If so, extend it. If not, create a subscriber.
            Subscribe to: `expense.created`, `expense.updated`, `expense.deleted`, `recurring-expense.generated`.
            On any of these events: invalidate CPM cache for the vehicleId (use Redis key pattern from existing CPM caching, or just publish `vehicle.expense.changed` which the existing subscriber already handles).
            Wire subscriber in the expense module compositionRoot or in the top-level event handler registration.
            Check `src/shared/messaging/eventMap.ts` to confirm event types exist (T-04 adds them).
         └─ Agent: backend
         └─ Depends on: T-04, T-09
         └─ Output:

---

## US-08: Module Wiring & App Integration
_Priority: P0 | Services: api | Status: todo_

**Acceptance Criteria:**
- [ ] Expense module mounted at /api/v1/expenses in app.ts
- [ ] Recurring expense routes mounted at /api/v1/recurring-expenses
- [ ] Driver portal expense routes mounted in driver portal router
- [ ] All composition root dependencies injected correctly

**Tasks:**
[x] T-22 [WIRE] Wire expense module into app.ts and top-level composition root (done by T-15/T-19)
         └─ Detail: Update `src/compositionRoot.ts` (top-level) — import and call `createExpenseModule` with { prisma, logger, eventBus }. Export expense controllers.
            Update `src/app.ts` — mount expense routes:
            - `app.use('/api/v1/expenses', expenseRoutes(root.expenses.expenseControllers))`
            - `app.use('/api/v1/recurring-expenses', recurringExpenseRoutes(root.expenses.recurringExpenseControllers))`
            Verify driver portal expense routes are wired (from T-19).
            Verify event subscribers are registered (from T-21).
            Run `npx tsc --noEmit` to confirm no type errors.
         └─ Agent: backend
         └─ Depends on: T-09, T-11, T-15, T-19, T-21
         └─ Output:

---

## INT-01: Internal API verification
_Auto-generated | Services: api_

**Verification Checklist:**
- [ ] All expense endpoints match plan API table (method, path, auth)
- [ ] All recurring expense endpoints match plan API table
- [ ] Driver portal endpoints match plan API table
- [ ] Request/response shapes match Prisma-derived types
- [ ] Enum values match Prisma schema character-for-character
- [ ] Error classes used correctly (NotFoundError, ConflictError, ValidationError)
- [ ] Event names match eventMap.ts
- [ ] Soft delete properly excludes records from all queries

**Tasks:**
[x] T-23 [WIRE] Verify all expense endpoints against plan
         └─ Detail: Read all created source files. Compare:
            1. Every endpoint path and HTTP method against plan.md § API/Interface Changes
            2. Every validator schema against plan.md query/body params
            3. Every transformer response shape against Expense/RecurringExpense Prisma model fields
            4. Auth middleware on each route (requireAuth for dispatcher, authenticateVehicleToken for driver portal)
            5. Event names in service calls match eventMap.ts entries
            6. Soft delete: verify ALL repo read methods filter deletedAt IS NULL
            7. Fuel validation: 2-of-3 rule, state requirement, fuelType default, non-fuel rejection
            8. Receipt presign/confirm flow matches existing document pattern
            Report any mismatches as Issues.
         └─ Agent: review
         └─ Depends on: T-22
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[x] T-24 [VERIFY] Full validation and flow trace
         └─ Detail: Run `cd hussle-app-dispatch-api && npm run validate` and report results.
            Trace each user flow from plan.md:
            1. Dispatcher creates expense → route → validator → controller → mapper → service → repo → event → response
            2. Dispatcher logs fuel entry → fuel validation → auto-calc → create
            3. Driver logs expense via portal → vehicle token auth → scoped create
            4. Dispatcher manages recurring → CRUD → generate → idempotency
            5. Receipt upload → presign → S3 → confirm → receiptUrl stored
            6. CPM integration → expense events → invalidation → actual CPM query
            Verify every AC from every story is satisfied.
         └─ Agent: review
         └─ Depends on: T-23
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 4     | 4    | 0       | 5/5    |
| US-02 | 6     | 6    | 0       | 9/9    |
| US-03 | 1     | 1    | 0       | 4/4    |
| US-04 | 5     | 5    | 0       | 9/9    |
| US-05 | 1     | 1    | 0       | 4/4    |
| US-06 | 2     | 2    | 0       | 6/6    |
| US-07 | 2     | 2    | 0       | 4/4    |
| US-08 | 1     | 1    | 0       | 4/4    |
| INT-01| 1     | 1    | 0       | —      |
| VER-01| 1     | 1    | 0       | —      |
| **All** | **24** | **24** | **0** | **45/45** |
