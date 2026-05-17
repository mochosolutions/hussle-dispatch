# Financial Model — Settlements Tasks
_Last updated: 2026-04-05 17:30_
_Plan: .planning/financial-model-settlements/plan.md_

---

## US-01: Settlement Generation
_Priority: P0 | Services: dispatch-api | Status: done_

Manual and programmatic generation of DRAFT settlements with computed line items (LOAD_REVENUE, DISPATCH_FEE, ACCESSORIAL, EXPENSE) for COMPANY_ASSET and LEASED_CARRIER carriers.

**Acceptance Criteria:**
- [ ] POST /api/v1/settlements/generate with COMPANY_ASSET carrier creates DRAFT with all line item types
- [ ] LEASED_CARRIER with includeExpensesOnSettlement: false omits EXPENSE line items
- [ ] LEASED_CARRIER with includeExpensesOnSettlement: true includes EXPENSE line items
- [ ] EXTERNAL_CARRIER returns 400
- [ ] Duplicate carrier/driver + overlapping period returns 409 Conflict
- [ ] Period with no delivered loads returns 400
- [ ] Totals (grossRevenue, dispatchFeeTotal, expensesTotal, netEarnings, totalMiles) computed correctly from line items
- [ ] All Decimal calculations use Decimal.js with ROUND_HALF_EVEN

**Tasks:**
[x] T-01 [DB] Create migration for sentAt/sentToEmail fields on Settlement
         └─ Agent: backend
         └─ Output: Modified prisma/schema.prisma (sentAt DateTime?, sentToEmail String?). Created migration 20260405140000_settlement_email_tracking.

[x] T-02 [TYPES] Create settlement domain types, repo port, and validators
         └─ Detail: Create `src/settlements/types/settlementTypes.ts` with types derived from Prisma:
            - `SettlementWithRelations` (Settlement + lineItems[] + carrier + driver? + vehicle?)
            - `SettlementListItem` (flat: id, settlementNumber, status, periodStart/End, grossRevenue, netEarnings, carrier.name, driver name)
            - `GenerateSettlementInput` { organizationId, carrierId, driverId?, vehicleId?, periodStart, periodEnd }
            - `ApproveSettlementInput` { organizationId, settlementId, userId }
            - `PaySettlementInput` { organizationId, settlementId, paymentMethod, paymentReference? }
            - `DisputeSettlementInput` { organizationId, settlementId, disputeReason }
            - `ListSettlementsInput` { organizationId, status?, carrierId?, driverId?, periodStart?, periodEnd?, skip, take }
            - `CreateAdjustmentInput` { organizationId, settlementId, description, amount, date }
            - `UpdateAdjustmentInput` { organizationId, settlementId, lineItemId, description?, amount?, date? }
            - `SettlementRepoPort` interface with: create, findById, findMany, count, update, addLineItem, updateLineItem, deleteLineItem, findOverlapping
            - `SettlementLoadQueryPort` interface: findDeliveredLoads(carrierId, driverId?, periodStart, periodEnd, organizationId)
            - `SettlementExpenseQueryPort` interface: findExpenses(vehicleId, periodStart, periodEnd, organizationId)
            Also create `src/settlements/validators/settlementValidators.ts` with Yup schemas:
            - generateSettlementValidator (body: carrierId uuid required, driverId uuid optional, vehicleId uuid optional, periodStart date required, periodEnd date required)
            - approveSettlementValidator (params: id uuid required)
            - paySettlementValidator (params: id uuid, body: paymentMethod string required, paymentReference string optional)
            - disputeSettlementValidator (params: id uuid, body: disputeReason string required)
            - listSettlementsValidator (query: status, carrierId, driverId, periodStart, periodEnd, skip, take)
            - createAdjustmentValidator (params: id uuid, body: description string required, amount number required, date date required)
            - updateAdjustmentValidator (params: id uuid + lineItemId uuid, body: partial of description, amount, date)
            - settlementIdValidator (params: id uuid)
            Follow patterns from `src/loads/validators/loadValidators.ts` and `src/invoices/types/invoiceTypes.ts`.
            Import enums from `@prisma/client`: SettlementStatus, SettlementItemType, CarrierType.
         └─ Agent: backend
         └─ Depends on: T-01
         └─ Output:

[x] T-03 [API] Create settlement repository
         └─ Detail: Create `src/settlements/repositories/settlementRepositoryPrisma.ts` implementing
            `SettlementRepoPort`. Follow pattern from `src/invoices/repositories/invoiceRepositoryPrisma.ts`.
            Key methods:
            - `create(data)` — create Settlement with nested lineItems via Prisma `create({ data, include })`
            - `findById(id, organizationId)` — findFirst with organizationId scope + include lineItems, carrier, driver, vehicle
            - `findMany(filters)` — paginated list with where clause: organizationId, status?, carrierId?, driverId?, periodStart/End range overlap. Include carrier (name), driver (firstName, lastName). OrderBy periodEnd desc.
            - `count(filters)` — count with same where clause
            - `update(id, organizationId, data)` — update Settlement fields
            - `addLineItem(settlementId, data)` — create SettlementLineItem
            - `updateLineItem(lineItemId, data)` — update SettlementLineItem
            - `deleteLineItem(lineItemId)` — delete SettlementLineItem
            - `findOverlapping(organizationId, carrierId, driverId, periodStart, periodEnd)` — find settlements whose period overlaps the given range (for idempotency check)
            - `recalculateTotals(settlementId)` — query all lineItems, sum by type, update Settlement totals
            Define `SETTLEMENT_DETAIL_INCLUDE` and `SETTLEMENT_LIST_INCLUDE` constants.
            Also create `src/settlements/repositories/settlementLoadQueryPrisma.ts` implementing `SettlementLoadQueryPort`:
            - Query loads where: organizationId, carrierId, driverId? (if provided), status = DELIVERED, deliveredAt (or stop delivery appointmentDate) within periodStart..periodEnd
            - Include: stops, accessorialCharges, carrier (for fee config)
            - Return load data needed for line item generation
            Also create `src/settlements/repositories/settlementExpenseQueryPrisma.ts` implementing `SettlementExpenseQueryPort`:
            - Query expenses where: organizationId, vehicleId, date within period, deletedAt: null
            - Return expense id, category, label, amount, date
         └─ Agent: backend
         └─ Depends on: T-02
         └─ Output:

[x] T-04 [API] Create settlement generation service
         └─ Detail: Create `src/settlements/services/settlementService.ts` with a `createSettlementService(deps)` factory.
            The `generate` method implements:
            1. Validate carrier type — fetch carrier, reject EXTERNAL_CARRIER (throw ValidationError "External carriers receive invoices, not settlements") and OWNER_OPERATOR (throw OwnerOperatorNotSupportedError)
            2. Check idempotency — call `settlementRepo.findOverlapping()`, throw ConflictError if exists
            3. Query delivered loads — call `loadQuery.findDeliveredLoads()`, throw ValidationError if empty ("No delivered loads found for this period")
            4. Build line items array:
               - For each load: create LOAD_REVENUE item (amount = carrierPayout or carrierRate), DISPATCH_FEE item (amount = load's dispatch fee from calculateLoadFinancials), ACCESSORIAL items (one per accessorialCharge on the load)
               - If carrier.type === COMPANY_ASSET || (carrier.type === LEASED_CARRIER && carrier.includeExpensesOnSettlement): query expenses via expenseQuery, create EXPENSE items
            5. Generate settlement number — pattern SETT-YYYYMMDD-XXXX (use sequence or timestamp-based)
            6. Compute totals from line items using Decimal.js ROUND_HALF_EVEN:
               - grossRevenue = sum of LOAD_REVENUE amounts
               - dispatchFeeTotal = sum of DISPATCH_FEE amounts (absolute)
               - expensesTotal = sum of EXPENSE amounts (absolute)
               - netEarnings = grossRevenue - dispatchFeeTotal - expensesTotal + sum of ADJUSTMENT amounts + sum of ACCESSORIAL amounts
               - totalMiles = sum of load totalMiles
            7. Create settlement via repo with status DRAFT
            8. Return { data: settlement, events: [{ type: 'settlement.draft.created', ... }] }
            Deps: { settlementRepo, loadQuery, expenseQuery, logger }
            Import Decimal from 'decimal.js'. Reuse ROUND_HALF_EVEN pattern from `src/shared/financials.ts`.
         └─ Agent: backend
         └─ Depends on: T-02, T-03
         └─ Output:

[x] T-05 [TEST] Unit tests for settlement generation
         └─ Detail: Create `src/settlements/services/__tests__/settlementService.test.ts`.
            Test the `generate` method:
            - creates DRAFT with correct line items for COMPANY_ASSET carrier
            - creates DRAFT without EXPENSE items for LEASED_CARRIER with includeExpensesOnSettlement=false
            - creates DRAFT with EXPENSE items for LEASED_CARRIER with includeExpensesOnSettlement=true
            - throws ValidationError for EXTERNAL_CARRIER
            - throws OwnerOperatorNotSupportedError for OWNER_OPERATOR
            - throws ConflictError when overlapping settlement exists
            - throws ValidationError when no delivered loads in period
            - computes grossRevenue, dispatchFeeTotal, expensesTotal, netEarnings correctly using Decimal.js
            - computes totalMiles as sum of load miles
            Mock all repo ports. Use AAA pattern. Follow test patterns from `src/loads/services/__tests__/loadService.test.ts`.
         └─ Agent: backend
         └─ Depends on: T-04
         └─ Output:

---

## US-02: Settlement Workflow
_Priority: P0 | Services: dispatch-api | Status: done_

Approve, pay, and dispute settlement transitions with validation.

**Acceptance Criteria:**
- [ ] PATCH /:id/approve on DRAFT → APPROVED, sets approvedAt + approvedByUserId
- [ ] PATCH /:id/approve on non-DRAFT returns 400
- [ ] PATCH /:id/pay on APPROVED → PAID, records paymentMethod, paymentReference, paidAt
- [ ] PATCH /:id/pay on non-APPROVED returns 400
- [ ] PATCH /:id/dispute on APPROVED → DISPUTED, records disputeReason
- [ ] PATCH /:id/dispute on non-APPROVED returns 400
- [ ] DISPUTED settlement can transition back to DRAFT or be re-approved

**Tasks:**
[x] T-06 [API] Add workflow methods to settlement service
         └─ Detail: Add to the settlement service factory in `src/settlements/services/settlementService.ts`:
            - `approve(input: ApproveSettlementInput)` — findById, check status is DRAFT or DISPUTED, update to APPROVED with approvedAt=new Date(), approvedByUserId=input.userId. Return { data, events: [{ type: 'settlement.approved' }] }
            - `pay(input: PaySettlementInput)` — findById, check status is APPROVED, update to PAID with paidAt=new Date(), paymentMethod, paymentReference. Return { data, events: [{ type: 'settlement.paid' }] }
            - `dispute(input: DisputeSettlementInput)` — findById, check status is APPROVED, update to DISPUTED with disputeReason. Return { data, events: [{ type: 'settlement.disputed' }] }
            For invalid transitions, throw InvalidTransitionError (from `src/shared/errors/`).
            For not found, throw NotFoundError.
         └─ Agent: backend
         └─ Depends on: T-04
         └─ Output:

[x] T-07 [TEST] Unit tests for settlement workflow
         └─ Detail: Add to `src/settlements/services/__tests__/settlementService.test.ts`:
            Test approve: DRAFT → APPROVED success, non-DRAFT throws InvalidTransitionError, not found throws NotFoundError
            Test pay: APPROVED → PAID success with payment fields, non-APPROVED throws, not found throws
            Test dispute: APPROVED → DISPUTED success with disputeReason, non-APPROVED throws, not found throws
            Test DISPUTED → APPROVED via approve (re-approval path)
         └─ Agent: backend
         └─ Depends on: T-06
         └─ Output:

---

## US-03: Settlement Adjustments
_Priority: P0 | Services: dispatch-api | Status: done_

Add, edit, and delete ADJUSTMENT line items on DRAFT settlements with automatic total recalculation.

**Acceptance Criteria:**
- [ ] POST /:id/adjustments adds ADJUSTMENT line item and recalculates totals
- [ ] PATCH /:id/adjustments/:lineItemId edits ADJUSTMENT and recalculates
- [ ] DELETE /:id/adjustments/:lineItemId removes ADJUSTMENT and recalculates
- [ ] Operations on non-DRAFT settlements return 400
- [ ] Only ADJUSTMENT-type line items can be edited/deleted

**Tasks:**
[x] T-08 [API] Create settlement adjustment service
         └─ Detail: Create `src/settlements/services/settlementAdjustmentService.ts` with factory
            `createSettlementAdjustmentService(deps: { settlementRepo, logger })`:
            - `addAdjustment(input: CreateAdjustmentInput)` — findById settlement, check status is DRAFT (else throw ValidationError "Can only add adjustments to DRAFT settlements"), add line item with type=ADJUSTMENT, recalculate totals, return updated settlement
            - `updateAdjustment(input: UpdateAdjustmentInput)` — findById settlement, check DRAFT, find line item, check type is ADJUSTMENT (else throw ValidationError "Can only edit ADJUSTMENT line items"), update fields, recalculate totals, return updated settlement
            - `deleteAdjustment(input: { organizationId, settlementId, lineItemId })` — findById settlement, check DRAFT, find line item, check type is ADJUSTMENT, delete, recalculate totals, return updated settlement
            Recalculation uses `settlementRepo.recalculateTotals(settlementId)`.
         └─ Agent: backend
         └─ Depends on: T-03
         └─ Output:

[x] T-09 [TEST] Unit tests for settlement adjustments
         └─ Detail: Create `src/settlements/services/__tests__/settlementAdjustmentService.test.ts`.
            Test addAdjustment: success on DRAFT, fails on APPROVED/PAID/DISPUTED
            Test updateAdjustment: success, fails on non-DRAFT, fails on non-ADJUSTMENT type
            Test deleteAdjustment: success, fails on non-DRAFT, fails on non-ADJUSTMENT type
            Verify recalculateTotals is called after each operation.
         └─ Agent: backend
         └─ Depends on: T-08
         └─ Output:

---

## US-04: Settlement List & Detail
_Priority: P0 | Services: dispatch-api | Status: done_

List settlements with filters and view settlement detail with all line items.

**Acceptance Criteria:**
- [ ] GET /api/v1/settlements returns paginated list filtered by status, carrierId, driverId, periodStart, periodEnd
- [ ] GET /api/v1/settlements/:id returns settlement with all line items
- [ ] All endpoints enforce organizationId scoping
- [ ] All endpoints require authentication via appAuth middleware

**Tasks:**
[x] T-10 [API] Add list and getById to settlement service
         └─ Detail: Add to `src/settlements/services/settlementService.ts`:
            - `list(input: ListSettlementsInput)` — call settlementRepo.findMany + count, return { data, meta: { total, skip, take, hasMore } }
            - `getById(input: { organizationId, settlementId })` — call settlementRepo.findById, throw NotFoundError if null, return { data }
         └─ Agent: backend
         └─ Depends on: T-04
         └─ Output:

---

## US-05: Controllers, Routes & Wiring
_Priority: P0 | Services: dispatch-api | Status: done_

Wire all settlement endpoints into Express routes with proper middleware, mappers, transformers, and composition root.

**Acceptance Criteria:**
- [ ] All 11 endpoints from the plan are registered and callable
- [ ] Mappers extract organizationId, userId from request context
- [ ] Transformers serialize Decimals to strings and Dates to ISO strings
- [ ] Composition root wires all dependencies correctly
- [ ] Routes mounted at /api/v1/settlements in app.ts

**Tasks:**
[x] T-11 [API] Create mappers for all settlement endpoints
         └─ Detail: Create mappers in `src/settlements/controllers/mappers/`:
            - `generateSettlementMapper.ts` — extract from req.body: carrierId, driverId?, vehicleId?, periodStart, periodEnd + req.organizationId
            - `listSettlementsMapper.ts` — extract from req.query: status?, carrierId?, driverId?, periodStart?, periodEnd?, skip, take + req.organizationId. Use parsePaginationParams from `src/shared/pagination.ts`.
            - `getSettlementMapper.ts` — extract req.params.id + req.organizationId
            - `approveSettlementMapper.ts` — extract req.params.id + req.organizationId + req.user.id (for approvedByUserId)
            - `paySettlementMapper.ts` — extract req.params.id + req.body.paymentMethod, paymentReference + req.organizationId
            - `disputeSettlementMapper.ts` — extract req.params.id + req.body.disputeReason + req.organizationId
            - `adjustmentMapper.ts` — extract req.params.id + req.body (description, amount, date) + req.organizationId; for update also req.params.lineItemId; for delete just ids
            - `sendSettlementMapper.ts` — extract req.params.id + req.organizationId
            Follow mapper pattern from `src/loads/controllers/mappers/` and `src/invoices/controllers/mappers/`.
         └─ Agent: backend
         └─ Depends on: T-02
         └─ Output:

[x] T-12 [API] Create transformers for settlement responses
         └─ Detail: Create transformers in `src/settlements/controllers/transformers/`:
            - `settlementTransformer.ts` — `toSettlementDetailResponse(settlement: SettlementWithRelations)`: convert Decimal fields to string (.toFixed(2)), dates to ISO string, include lineItems array with each item transformed
            - `settlementListTransformer.ts` — `toSettlementListResponse(settlements, meta)`: flatten each item to SettlementListItem shape, include pagination meta. Use `sendList` from `src/shared/responseEnvelope.ts`.
            Follow transformer pattern from `src/loads/controllers/transformers/loadTransformer.ts`.
         └─ Agent: backend
         └─ Depends on: T-02
         └─ Output:

[x] T-13 [API] Create settlement controllers
         └─ Detail: Create `src/settlements/controllers/settlementController.ts` with
            `createSettlementControllers(deps)` factory returning handlers:
            - `generate` — generateSettlementMapper → service.generate → transformer → sendSingle(res, data, 201)
            - `list` — listSettlementsMapper → service.list → listTransformer → sendList(res, data, meta)
            - `getById` — getSettlementMapper → service.getById → transformer → sendSingle(res, data)
            - `approve` — approveSettlementMapper → service.approve → transformer → sendSingle(res, data)
            - `pay` — paySettlementMapper → service.pay → transformer → sendSingle(res, data)
            - `dispute` — disputeSettlementMapper → service.dispute → transformer → sendSingle(res, data)
            - `downloadPdf` — stub for now (will be wired in US-06)
            - `sendEmail` — stub for now (will be wired in US-07)
            Create `src/settlements/controllers/adjustmentController.ts` with
            `createAdjustmentControllers(deps)` factory:
            - `addAdjustment` — adjustmentMapper → adjustmentService.addAdjustment → transformer → sendSingle(res, data, 201)
            - `updateAdjustment` — adjustmentMapper → adjustmentService.updateAdjustment → transformer → sendSingle(res, data)
            - `deleteAdjustment` — adjustmentMapper → adjustmentService.deleteAdjustment → res.status(204).send()
            Deps include service references and eventDispatcher. Dispatch events fire-and-forget.
            Follow controller pattern from `src/invoices/controllers/invoiceController.ts`.
         └─ Agent: backend
         └─ Depends on: T-04, T-06, T-08, T-10, T-11, T-12
         └─ Output:

[x] T-14 [API] Create routes, composition root, event map, and app.ts wiring
         └─ Detail: Create `src/settlements/routes/settlementRoutes.ts`:
            ```
            POST   /generate                     → requireAuth, validateRequest(generateSettlementValidator), controllers.generate
            GET    /                              → requireAuth, validateRequest(listSettlementsValidator), controllers.list
            GET    /:id                           → requireAuth, validateRequest(settlementIdValidator), controllers.getById
            PATCH  /:id/approve                   → requireAuth, validateRequest(approveSettlementValidator), controllers.approve
            PATCH  /:id/pay                       → requireAuth, validateRequest(paySettlementValidator), controllers.pay
            PATCH  /:id/dispute                   → requireAuth, validateRequest(disputeSettlementValidator), controllers.dispute
            GET    /:id/pdf                       → requireAuth, validateRequest(settlementIdValidator), controllers.downloadPdf
            POST   /:id/adjustments               → requireAuth, validateRequest(createAdjustmentValidator), adjustmentControllers.addAdjustment
            PATCH  /:id/adjustments/:lineItemId   → requireAuth, validateRequest(updateAdjustmentValidator), adjustmentControllers.updateAdjustment
            DELETE /:id/adjustments/:lineItemId   → requireAuth, validateRequest(updateAdjustmentValidator), adjustmentControllers.deleteAdjustment
            POST   /:id/send                      → requireAuth, validateRequest(settlementIdValidator), controllers.sendEmail
            ```
            Use `requireAuth` middleware from `src/shared/middleware/` (check actual export name — may be `appAuth`).
            Create `src/settlements/compositionRoot.ts` following invoice module pattern:
            - Takes deps: { prismaClient, eventBus, logger, storageProvider?, browserPool?, notificationService? }
            - Wires: repos → services → controllers
            - Returns: { controllers, adjustmentControllers, initializeSubscriber }
            Create `src/settlements/index.ts` entry point (imports sharedEventBus, creates module, exports router).
            Edit `src/shared/messaging/eventMap.ts` — add settlement event types:
            - 'settlement.draft.created': { settlementId, organizationId, carrierId, settlementNumber }
            - 'settlement.approved': { settlementId, organizationId }
            - 'settlement.paid': { settlementId, organizationId }
            - 'settlement.disputed': { settlementId, organizationId }
            - 'settlement.generate': { organizationId, carrierId, driverId?, vehicleId?, periodStart, periodEnd }
            Edit `src/app.ts` — import settlement router and mount at `/api/v1/settlements`.
         └─ Agent: backend
         └─ Depends on: T-13
         └─ Output:

---

## US-06: Settlement PDF
_Priority: P0 | Services: dispatch-api | Status: done_

Generate settlement PDF documents with revenue, deductions, and per-mile metrics.

**Acceptance Criteria:**
- [ ] GET /:id/pdf returns a PDF document
- [ ] PDF header shows settlement number, period, driver/carrier name, truck info
- [ ] PDF revenue section lists loads with route, miles, delivery date, amount
- [ ] PDF deductions section lists dispatch fees and expenses by category
- [ ] PDF totals shows gross revenue, total deductions, net earnings
- [ ] PDF includes per-mile metrics (rev/mi, cost/mi, net/mi)

**Tasks:**
[x] T-15 [PDF] Create settlement PDF template and styles
         └─ Detail: Create `src/settlements/templates/SettlementPdfTemplate.tsx` — React component
            receiving `SettlementTemplateData` (define in `src/settlements/types/settlementTypes.ts`).
            Sections:
            - Header: settlement number, period (formatted MM/DD/YYYY), carrier name, driver name, truck unit number
            - Revenue table: one row per LOAD_REVENUE line item showing load number, route (origin city → dest city), miles, delivery date, amount
            - Deductions table: DISPATCH_FEE items, then EXPENSE items grouped by category
            - Adjustments table: ADJUSTMENT items with description, date, amount (can be positive/negative)
            - Totals section: Gross Revenue, Dispatch Fees, Expenses, Adjustments, Net Earnings
            - Per-mile metrics row: Revenue/Mile, Cost/Mile, Net/Mile
            Create `src/settlements/templates/settlementTemplateStyles.ts` with style objects.
            Follow pattern from `src/invoices/templates/InvoicePdfTemplate.tsx` and `invoiceTemplateStyles.ts`.
            Use ReactDOMServer.renderToStaticMarkup for HTML output.
         └─ Agent: backend
         └─ Depends on: T-02
         └─ Output:

[x] T-16 [PDF] Create settlement PDF data builder and wire PDF endpoint
         └─ Detail: Create `src/settlements/services/settlementPdfDataBuilder.ts`:
            - `buildSettlementPdfData(settlement: SettlementWithRelations, deps: { orgSettingsQuery })` → `SettlementTemplateData`
            - Fetch org settings for branding (logo, company name, address)
            - Transform Decimal → string (2 decimals), dates → formatted strings
            - Group line items by type for template sections
            - Compute per-mile metrics: revPerMile = grossRevenue / totalMiles, costPerMile = (dispatchFeeTotal + expensesTotal) / totalMiles, netPerMile = netEarnings / totalMiles
            - Handle edge case: totalMiles = 0 → metrics show "N/A"
            Wire the `downloadPdf` controller method in `settlementController.ts`:
            - Call pdfDataBuilder → render template to HTML → use `pdfGenerationService` (from `src/invoices/services/pdfGenerationService.ts` or shared) to convert HTML → PDF buffer → stream response with Content-Type: application/pdf
            Update composition root to inject pdfDataBuilder and browserPool into controller deps.
            Follow pattern from `src/invoices/services/invoicePdfDataBuilder.ts`.
         └─ Agent: backend
         └─ Depends on: T-15, T-13
         └─ Output:

---

## US-07: Settlement Email Delivery
_Priority: P1 | Services: dispatch-api, emails | Status: done_

Email settlement PDFs to driver/carrier contacts using React Email templates.

**Acceptance Criteria:**
- [ ] POST /:id/send on APPROVED/PAID sends email with PDF attachment
- [ ] Email uses renderSettlementEmail from @hussle/emails
- [ ] Recipient resolved from driver contact (COMPANY_ASSET) or carrier primary contact (LEASED_CARRIER)
- [ ] POST /:id/send on DRAFT/DISPUTED returns 400
- [ ] Settlement records sentAt and sentToEmail after send
- [ ] New settlementEmail template in hussle-emails package

**Tasks:**
[x] T-17 [EMAIL] Create settlement email template in hussle-emails
         └─ Detail: In `hussle-emails/` package, create:
            - `src/settlement/SettlementEmail.tsx` — React Email component using EmailLayout, DataTable, CtaButton
              from `src/shared/`. Shows: settlement number, period dates, carrier/driver name, net earnings amount.
              CTA button: "View Settlement" (href from data).
            - `src/settlement/renderSettlementEmail.ts` — async function:
              `renderSettlementEmail(data: SettlementEmailData): Promise<{ subject: string; html: string }>`
              SettlementEmailData: { settlementNumber, periodStart, periodEnd, recipientName, netEarnings, viewUrl? }
              Subject: `Settlement ${settlementNumber} — ${periodStart} to ${periodEnd}`
            - Export `renderSettlementEmail` from `src/index.ts` barrel
            - Build: run `npx tsc` in hussle-emails to update dist/
            Follow pattern from `src/invoice/renderInvoiceEmail.ts` exactly.
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-18 [EMAIL] Create settlement email service and wire send endpoint
         └─ Detail: Create `src/settlements/services/settlementEmailService.ts`:
            - `createSettlementEmailService(deps: { settlementRepo, pdfDataBuilder, pdfGenerator, notificationService, logger })`
            - `sendSettlementEmail(input: { organizationId, settlementId })`:
              1. Fetch settlement with relations
              2. Validate status is APPROVED or PAID (else throw ValidationError)
              3. Resolve recipient: if carrier.type === COMPANY_ASSET → driver's email; if LEASED_CARRIER → carrier primary contact email. Throw ValidationError if no email found.
              4. Generate PDF (reuse pdfDataBuilder + pdfGenerator)
              5. Render email HTML via `renderSettlementEmail` from `@hussle/emails`
              6. Send via notificationService.sendEmail with PDF attachment as `Settlement_${settlementNumber}.pdf`
              7. Update settlement: sentAt = new Date(), sentToEmail = recipientEmail
              8. Return updated settlement
            Wire `sendEmail` controller method in settlementController.ts — call emailService.sendSettlementEmail.
            Update composition root to inject notificationService and wire email service.
            Follow pattern from `src/invoices/services/invoiceEmailService.ts`.
         └─ Agent: backend
         └─ Depends on: T-17, T-16
         └─ Output:

---

## US-08: Auto-Draft Scheduled Generation
_Priority: P1 | Services: dispatch-api | Status: done_

Weekly scheduled job that auto-generates DRAFT settlements for eligible drivers/carriers.

**Acceptance Criteria:**
- [ ] Scheduled job publishes settlement.generate events for eligible entities with delivered loads in Mon–Sun window
- [ ] Subscriber generates DRAFT settlements from events
- [ ] Already-settled loads are not double-counted (idempotency)
- [ ] One failed generation does not block others
- [ ] Job defaults to Sunday 11 PM, configurable via org settings

**Tasks:**
[x] T-19 [SCHED] Create settlement generator subscriber
         └─ Detail: Create `src/settlements/services/settlementGeneratorSubscriber.ts`:
            - `createSettlementGeneratorSubscriber(deps: { settlementService, logger })`
            - Subscribes to 'settlement.generate' event
            - Handler: receives { organizationId, carrierId, driverId?, vehicleId?, periodStart, periodEnd }
            - Calls settlementService.generate() wrapped in try/catch — on ConflictError (already exists), log info and skip; on other errors, log error but do NOT rethrow (isolation)
            Wire subscriber in compositionRoot's `initializeSubscriber` function.
            Register via `eventBus.subscribe('settlement.generate', 'settlement-generator', handler)`.
            Follow subscriber pattern from `src/load-intel/services/cpmInvalidationSubscriber.ts` or `src/notifications/services/`.
         └─ Agent: backend
         └─ Depends on: T-14
         └─ Output:

[x] T-20 [SCHED] Create weekly settlement cron job
         └─ Detail: Create `src/settlements/services/settlementCronJob.ts`:
            - Uses `node-cron` (verify it's in package.json dependencies — if not, add it)
            - `createSettlementCronJob(deps: { prisma, eventBus, logger })`
            - Cron schedule: '0 23 * * 0' (Sunday 11 PM) — or read from OrgSettings if configured
            - On tick:
              1. Query all organizations
              2. For each org, query distinct carrier+driver combos with DELIVERED loads in the past Mon–Sun (compute Mon = current date - 6 days, Sun = current date)
              3. For each combo, publish 'settlement.generate' event with { organizationId, carrierId, driverId, vehicleId, periodStart: Monday 00:00, periodEnd: Sunday 23:59:59 }
              4. Log count of events published
            - Start/stop methods for lifecycle management
            Wire cron job start in `src/settlements/index.ts` after subscriber initialization.
            Check if node-cron is already used elsewhere: grep for 'node-cron' in package.json.
         └─ Agent: backend
         └─ Depends on: T-19
         └─ Output:

---

## INT-01: Verify settlement module integration
_Auto-generated | Services: dispatch-api_

**Verification Checklist:**
- [ ] All 11 endpoints registered and responding
- [ ] Request/response shapes match plan specification
- [ ] Enum values match Prisma schema (SettlementStatus, SettlementItemType, CarrierType)
- [ ] Auth middleware enforced on all routes
- [ ] Organization scoping enforced on all queries
- [ ] Error responses use CustomError hierarchy consistently
- [ ] Event map types match event payloads published by services
- [ ] Composition root wires all dependencies without missing ports

**Tasks:**
[x] T-21 [WIRE] Verify full module wiring and contract compliance
         └─ Detail: Read all settlement module source files. Verify:
            1. Every route path matches the plan's endpoint table
            2. Every mapper extracts organizationId from req context
            3. Every transformer converts Decimal → string, Date → ISO
            4. Composition root passes all required deps to services
            5. Event types in eventMap.ts match what services publish
            6. Validators cover all required/optional fields per plan
            7. Repository includes organizationId in all WHERE clauses
            8. No direct Prisma imports in services
            9. No business logic in controllers
            10. All error cases throw typed CustomError subclasses
            Report any gaps as issues.
         └─ Agent: review
         └─ Depends on: T-14, T-16, T-18, T-20
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[x] T-22 [VERIFY] Trace complete settlement flow and verify all AC
         └─ Detail: For each user flow (Manual Generation, Auto-Draft, Email Delivery, Dispute):
            trace from entry point through service through repository and back.
            Check every acceptance criterion from ALL stories (US-01 through US-08) is satisfied
            by the implementation. Verify:
            - Generate → line items created → totals computed → DRAFT returned
            - Approve → status change → approvedAt set
            - Pay → status change → payment fields set
            - Dispute → status change → disputeReason set → can re-approve
            - Adjustment CRUD → only on DRAFT → totals recalculated
            - PDF → all sections populated → per-mile metrics
            - Email → recipient resolution → PDF attached → sentAt recorded
            - Cron → events published → subscriber generates → idempotent
            Report unmet AC as issues.
         └─ Agent: review
         └─ Depends on: T-21
         └─ Output:

---

## FIX-01: Post-review hardening
_Priority: P0 | Services: dispatch-api | Status: done_

Fixes identified during INT-01/VER-01 verification pass.

**Tasks:**
[x] T-23 [FIX] Add organizationId scoping to repo.update and carrierQuery
         └─ Detail:
            1. `src/settlements/repositories/settlementRepositoryPrisma.ts` — change `update` method signature
               to accept `(id: string, organizationId: string, data: ...)`. Update the Prisma `where` clause to
               `{ id, organizationId }`. Also update `SettlementRepoPort.update` signature in settlementTypes.ts.
            2. `src/settlements/types/settlementTypes.ts` — update `CarrierQueryPort.findById` to accept
               `(carrierId: string, organizationId: string)`. Update all callers.
            3. `src/settlements/repositories/settlementCarrierQueryPrisma.ts` — add `organizationId` to the
               `findUnique` where clause (Carrier has `managedByOrgId` — use that for scoping).
            4. Update all service callers of `repo.update` to pass `organizationId`:
               - settlementService.ts: approve, pay, dispute
               - settlementAdjustmentService.ts: recalculateTotals calls don't use update directly, but check
               - settlementEmailService.ts: the update for sentAt/sentToEmail
            5. Update all callers of `carrierQuery.findById` to pass organizationId (settlementService.generate).
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-24 [FIX] Defer index.ts side effects to explicit initialization
         └─ Detail:
            `src/settlements/index.ts` currently runs subscriber init and cron start at import time.
            Refactor to export a `startSettlementModule()` async function instead. The caller (app.ts or
            wherever the module is bootstrapped) calls it explicitly.
            1. Wrap subscriber init + cron start in `export const startSettlementModule = async (): Promise<void>`
            2. Export the router separately (can remain at module level since it's just wiring)
            3. In `src/app.ts`, after mounting routes, call `startSettlementModule().catch(...)` or
               add it to whatever startup sequence exists (check how invoices/notifications handle this —
               they may also do side effects at import time, in which case match their pattern instead).
            NOTE: If the invoice module also does side effects at import time (it does — check
            `src/invoices/index.ts`), then keep the settlement module consistent with that pattern and
            skip this fix. Consistency > purity.
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-25 [FIX] Add sendSettlementValidator and fix PDF template double-wrapping
         └─ Detail:
            1. `src/settlements/validators/settlementValidators.ts` — add `sendSettlementValidator` (identical
               to `settlementIdValidator` for now, but named distinctly for future extensibility).
            2. `src/settlements/routes/settlementRoutes.ts` — update the POST /:id/send route to use
               `sendSettlementValidator` instead of `settlementIdValidator`.
            3. `src/settlements/templates/SettlementPdfTemplate.tsx` — remove the outer `<html>/<head>/<style>`
               wrapper from the component. The component should return just the `<div className="settlement-container">`
               content, matching how `InvoicePdfTemplate.tsx` works (it returns a `<div className="invoice-container">`
               without html/head tags). The `settlementPdfGenerationService.ts` already wraps the rendered markup
               in a full HTML document with `<style>` tags.
            4. `src/settlements/services/settlementPdfGenerationService.ts` — verify it wraps the rendered
               markup in `<!DOCTYPE html><html><head><style>...</style></head><body>...</body></html>`.
               If the template still has its own wrapper after step 3, adjust accordingly.
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-26 [FIX] Replace settlement number random suffix with sequence-safe generation
         └─ Detail:
            `src/settlements/services/settlementService.ts` `generateSettlementNumber()` uses random 4 digits
            which can collide. Replace with a safer approach:
            1. Option A (simple): Use `Date.now()` milliseconds as the suffix (13 digits, no collision).
               Format: `SETT-YYYYMMDD-{timestamp-last-6-digits}`.
            2. Option B (robust): Query the DB for the latest settlement number for today and increment.
               This requires passing the repo to the function.
            Go with Option A (simple, no DB round-trip). Update `generateSettlementNumber` to use
            `String(Date.now()).slice(-6)` as the suffix, giving `SETT-YYYYMMDD-XXXXXX` (6 digits).
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-27 [FIX] Store line item amounts as positive, handle sign in totals logic only
         └─ Detail:
            Currently the service negates DISPATCH_FEE and EXPENSE amounts before storing, then
            `recalculateTotals` calls `.abs()` on them. This double-transformation is fragile.
            Refactor to store all amounts as positive values and handle the sign only in the totals
            calculation:
            1. `src/settlements/services/settlementService.ts` generate method:
               - DISPATCH_FEE: store `abs()` of dispatch fee (positive)
               - EXPENSE: store `abs()` of expense amount (positive)
               - LOAD_REVENUE, ACCESSORIAL: unchanged (already positive)
            2. `src/settlements/repositories/settlementRepositoryPrisma.ts` recalculateTotals:
               - DISPATCH_FEE: add directly to dispatchFeeTotal (already positive)
               - EXPENSE: add directly to expensesTotal (already positive)
               - Remove `.abs()` calls since amounts are now stored positive
               - Net formula: `grossRevenue - dispatchFeeTotal + accessorialsTotal - expensesTotal + adjustmentsTotal`
            3. `src/settlements/services/settlementPdfDataBuilder.ts`:
               - Dispatch fee and expense amounts will now be positive in the DB
               - Prepend "-$" in the template display or handle in the template
               - Actually, the PDF template already shows them under "Deductions" so positive display
                 is fine — just format as-is
            4. Update tests in `settlementService.test.ts` to expect positive amounts for fees/expenses.
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 5     | 5    | 0       | 8/8    |
| US-02 | 2     | 2    | 0       | 7/7    |
| US-03 | 2     | 2    | 0       | 5/5    |
| US-04 | 1     | 1    | 0       | 4/4    |
| US-05 | 4     | 4    | 0       | 5/5    |
| US-06 | 2     | 2    | 0       | 6/6    |
| US-07 | 2     | 2    | 0       | 6/6    |
| US-08 | 2     | 2    | 0       | 5/5    |
| INT-01| 1     | 1    | 0       | —      |
| VER-01| 1     | 1    | 0       | —      |
| FIX-01| 5     | 0    | 0       | —      |
| **All** | **27** | **22** | **0** | **46/46** |
