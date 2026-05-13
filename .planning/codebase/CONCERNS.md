# Codebase Concerns

**Analysis Date:** 2026-05-13

> **Primary sources:**
> - `docs/audit/production-readiness-audit-2026-04-20.md` (10 CRIT / 20 HIGH issues — many resolved during MVP push)
> - `docs/audit/database-review-2026-04-22.md` (schema / Prisma DB audit)
> - `docs/tasks/mvp-plan.md` (consolidated MVP plan — tracks completion + open work)
> - Fresh source code scan (TODOs, type assertions, eslint-disables, console.log usage, large files)
>
> **Scope:** Full repo. Issues below are grouped by severity (Critical / High / Medium / Low) and tagged by area (security · data-integrity · perf · DX · tests · deps).
>
> **Note on audit status:** Several CRIT items from the 2026-04-20 audit have been resolved during the MVP push (Tracks 1–11). Resolved items are still listed below in compressed form so the executor can verify they remain green; open items are called out as **OPEN** and contain a fix path.

---

## Critical

### CRIT-DB-01 Notification history endpoint has no tenant scoping (security · data-integrity) — **OPEN**
- **Files:** `hussle-app-dispatch-api/src/notifications/controllers/loadNotificationController.ts` (lines 129–133), `hussle-app-dispatch-api/src/notifications/routes/notificationRoutes.ts` (lines 83–88), `hussle-app-dispatch-api/src/notifications/repositories/notificationLogRepositoryPrisma.ts` (lines 26–30)
- **Concern:** `GET /notifications/loads/:loadId/history` calls `logRepo.findByLoadId(loadId)` which queries `NotificationLog` by `loadId` only. The route is gated by `requireAuth` but never validates that the load belongs to the caller's organization. Any authenticated user can read any org's load notification history by guessing UUIDs.
- **Why it matters:** Lateral tenant leak. Outbound customer/SMS history is sensitive (PII, ETA disclosure, broker contact info).
- **Fix approach:** Add `organizationId` argument to `findByLoadId(loadId, organizationId)` and scope via `load: { organizationId }` (mirror `invoiceRepositoryPrisma`). Apply the same fix to `loadNotificationOverrideRepositoryPrisma.findByLoadId` (MED-08 in DB review).

### CRIT-DB-02 `invoice.findAll` returns unbounded rows (perf · data-integrity) — **OPEN**
- **File:** `hussle-app-dispatch-api/src/invoices/repositories/invoiceRepositoryPrisma.ts` (lines 143–148)
- **Concern:** No `take` / `skip`, no server-side cap, pulls all related rows (load/carrier/customer truncated selects) for every list request.
- **Why it matters:** Memory pressure + slow responses guaranteed once an org reaches thousands of invoices.
- **Fix approach:** Extend `InvoiceListFilters` with `page` / `limit`, server-side default 50 / max 200, return `{ data, meta }` envelope (match `expenseRepositoryPrisma`). Add an Invoice count method for pagination.

### CRIT-DB-03 `NotificationLog → Load` cascade deletes audit history (data-integrity) — **OPEN**
- **File:** `hussle-app-dispatch-api/prisma/schema.prisma` (line 1138 plus 867 `LoadStatusHistory`, 886 `CheckCall`)
- **Concern:** `onDelete: Cascade` from Load wipes regulatory/financial communication history on Load hard-delete. Load is soft-deleted in practice today, but the constraint should match intent. GDPR right-to-erasure or accidental admin cleanup would silently destroy audit evidence.
- **Why it matters:** Regulatory + dispute-resolution audit trail at risk.
- **Fix approach:** Change `NotificationLog`, `LoadStatusHistory`, `CheckCall` to `onDelete: Restrict`. Keep `Cascade` on non-historical children (Stop, AccessorialCharge, LoadNotificationOverride, LoadTrackingToken, SmsPromptSchedule). Requires a Prisma migration.

### CRIT-DB-04 `Invoice.invoiceNumber` globally unique, not per-org (data-integrity) — **OPEN**
- **File:** `hussle-app-dispatch-api/prisma/schema.prisma` (line 920 `invoiceNumber String @unique`; line 1288 `Settlement.settlementNumber` has no unique at all)
- **Concern:** Cross-tenant collision: two orgs that independently issue invoice "INV-001" collide at the second create. `Settlement.settlementNumber` allows duplicates silently within the same org.
- **Why it matters:** Production multi-tenancy bug; manifests as 500 on second org's invoice create once both reach common numbering.
- **Fix approach:** Denormalize `organizationId` onto Invoice and add `@@unique([organizationId, invoiceNumber])`. Add `@@unique([organizationId, settlementNumber])` to Settlement. Requires backfill + service adjustment in invoice service.

### CRIT-02 No CSRF protection on auth endpoints (security)
- **File:** `hussle-app-dispatch-api/src/auth/` (cookie handling, security middleware)
- **Concern:** Cookies set without explicit `SameSite` enforcement. No CSRF tokens. CORS allows credentials from frontend origin.
- **Why it matters:** Cross-site form submission could hijack authenticated session.
- **Fix approach:** Add `SameSite: 'Lax'` (or `'Strict'`) to all auth cookies. Add CSRF token validation for state-changing routes — `csurf` or a double-submit cookie pattern keyed off the refresh-session ID.

### CRIT-05 No data scoping enforcement at middleware level (security · data-integrity)
- **Files:** Every service/repository in `hussle-app-dispatch-api/src/`
- **Concern:** `req.organizationId` is injected by auth middleware, but each repo manually filters by it. No global middleware nor Prisma extension validates that queries are org-scoped. CRIT-DB-01 (notification history) and MED-08 (`LoadNotificationOverride.findByLoadId`) are concrete proofs of the leak class.
- **Why it matters:** Any forgotten filter = cross-tenant data leak. The codebase has 30+ repositories — manual scoping is brittle.
- **Fix approach:** Add a Prisma `$extends` middleware that asserts `where.organizationId` (or relational scope) is present on all multi-tenant models. Use a model-tag allowlist to opt out the genuinely org-less rows (sessions, system tables). Combine with a lint rule barring direct `prisma.*.findMany` calls outside repositories.

### CRIT-12 JWT_SECRET fatal-throws as plain Error (security · DX)
- **File:** `hussle-app-dispatch-api/src/shared/middleware/authenticateUser.ts:24`
- **Concern:** `throw new Error('JWT_SECRET environment variable is not set')` — plain `Error`, not a typed error. Violates project rule (NEVER generic Error). Worse, this is checked per-request at middleware time, not at process start.
- **Why it matters:** Production miss-config surfaces as request 500s instead of failing fast on boot. Plain Error leaks stack to clients in non-prod env.
- **Fix approach:** Validate JWT_SECRET at startup in `src/index.ts` and `process.exit(1)` if missing. In middleware, throw `UnauthorizedError`. Apply the same fail-fast pattern to all required env vars (use a `loadConfig()` helper).

### Resolved during MVP push (verify still green)
| ID | Original concern | Resolution check |
|----|------------------|------------------|
| CRIT-01 | Exposed AWS creds in `dat-load-scraper/src/utils/s3.ts` | Comments say "now removed". Re-verify lines 8–9, 93–94, 113–114 contain no hardcoded keys. Rotate the leaked keys regardless — they were in git history. |
| CRIT-03 | Load board ingest had no auth | `hussle-app-dispatch-api/src/load-board/routes/loadBoardRoutes.ts:17–22` now uses `sessionOrApiKeyAuth`. Verified. |
| CRIT-04 | Invite acceptance didn't create user/membership | MVP plan marks complete. Verify `hussle-app-dispatch-api/src/auth/services/acceptInvitationService.ts` now writes User + Membership inside a transaction. |
| CRIT-06 | Auto-invoice on DELIVERED stubbed | Now handled by `invoiceReadinessSubscriber` on `load.delivered` + `load.tonu` events. Old `invoiceSubscriber.ts` deleted. |
| CRIT-07 | LoadRateDrawer submit commented out | MVP track 2 reports rate-drawer wired. Verify `LoadRateDrawer/index.tsx` dispatches `updateLoad` saga, not a noop. |
| CRIT-08 | Weekly gross endpoint missing | Track 8 reports endpoint built. Verify `/loads/weekly-gross` route exists and joins vehicle targets. |
| CRIT-09 | DAT push handler unimplemented in extension | Track 10 covers DAT scrape. Verify `dat-load-scraper/src/contentScript/contentScript.ts:103–112` now sends DAT loads to API (it does — lines 92–112). |
| CRIT-10 | Driver pay config missing from UI | Driver pay schema + UI shipped (driver payType/payRate). Verify `DriverFormDrawer` exposes payType selector. |
| CRIT-11 | Generic `Error` for "Settlement not found after update" | `hussle-app-dispatch-api/src/settlements/repositories/settlementRepositoryPrisma.ts:114` still throws plain `Error`. **OPEN** — replace with `ConflictError` or `NotFoundError`. |

---

## High

### HIGH-DB-01 Missing FK indexes on hot query columns (perf) — **OPEN (migration pending)**
- **File:** `hussle-app-dispatch-api/prisma/schema.prisma`
- **Concern:** Schema-level `@@index` additions for `Load.driverId`, `Load.vehicleId`, `Invoice.carrierId`, `Settlement.driverId`, `SettlementLineItem.settlementId`, plus composite `AuditLog([organizationId, entityType, entityId])` were applied to schema during DB review. **Migration was never generated.**
- **Why it matters:** Full-table scans on growing tables; settlement and invoice list latency degrades nonlinearly.
- **Fix approach:** Run `npx prisma migrate dev --create-only --name add_missing_fk_indexes`, review generated SQL, ship.

### HIGH-DB-02 Additional unindexed FK / filter columns (perf)
- **File:** `hussle-app-dispatch-api/prisma/schema.prisma`
- **Concern:** ~15+ FK columns not in HIGH-DB-01 also lack indexes: `Load.dispatcherUserId/createdByUserId/updatedByUserId`, `Invoice.createdByUserId/approvedByUserId`, `Settlement.approvedByUserId/vehicleId`, `LoadTrackingToken.driverId`, `SmsPromptSchedule.driverId`, `Expense.driverId/recurringExpenseId`, `Loan.organizationId/vehicleId`, `LoanPayment.loanId/expenseId`, `RecurringExpense.organizationId/loanId`, `Membership.invitedById`, `Invitation.invitedById`, `LoadStatusHistory.changedByUserId`, `CheckCall.calledByUserId`.
- **Fix approach:** Audit query patterns; emit `add_secondary_fk_indexes` migration grouping all needed indexes.

### HIGH-DB-03 NotificationLog grows unbounded — no retention/partition (perf · data-integrity)
- **Files:** `hussle-app-dispatch-api/prisma/schema.prisma:1125–1142` (plus `LoadStatusHistory`, `CheckCall`, `AuditLog`, `SmsPromptSchedule`)
- **Concern:** ~hundreds of thousands of rows/month/org at modest volume. No partition, no retention, no archive path.
- **Fix approach:** Short-term: scheduled job to archive/delete rows older than 90 days; add `@@index([createdAt])` so range queries are fast. Long-term: monthly partition by `createdAt` (raw SQL — Prisma can't express it).

### HIGH-DB-07 Missing unique constraints on business identifiers (data-integrity)
- **File:** `hussle-app-dispatch-api/prisma/schema.prisma`
- **Concern:** `Carrier.mcNumber`, `Customer.mcNumber`, `Vehicle.vin`, `Vehicle.licensePlate` have no unique constraint, not even per-org. Duplicates silently propagate into loads/settlements/reports.
- **Fix approach:** Add `@@unique([managedByOrgId, mcNumber])` on Carrier (nullable), `@@unique([organizationId, mcNumber])` on Customer, `@@unique([carrierId, vin])` and `@@unique([carrierId, licensePlate])` on Vehicle. Postgres treats NULLs as distinct so optional columns stay permissive. Needs migration + de-dup data migration.

### HIGH-02 Expense calculations use native JS numbers (data-integrity · financial)
- **File:** `hussle-app-dispatch-api/src/expenses/services/expenseService.ts:42`
- **Concern:** Fuel calc `gallons * pricePerGallon` uses JS number multiplication. No Decimal.js.
- **Why it matters:** Float precision errors on every fuel expense. Drifts from settlement (banker's rounding).
- **Fix approach:** Wrap fuel calculations in Decimal.js with `ROUND_HALF_EVEN`, consistent with settlements + load financials. Apply same pattern to any other numeric expense math.

### HIGH-03 IFTA reporting uses `Math.round()` instead of Decimal (data-integrity · financial)
- **File:** `hussle-app-dispatch-api/src/ifta/services/iftaReportService.ts:41`
- **Concern:** `roundTwo` is `Math.round(v * 100) / 100` — JS rounding, not banker's.
- **Why it matters:** IFTA totals drift from settlement totals → reconciliation pain at quarter-end.
- **Fix approach:** Replace with `new Decimal(v).toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN).toNumber()`. Apply everywhere IFTA does aggregation.

### HIGH-05 No optimistic locking on load status transitions (data-integrity)
- **File:** `hussle-app-dispatch-api/src/loads/services/loadStatusService.ts`
- **Concern:** Schema added `Load.version` (good), but the status service does not yet read/increment it as the optimistic lock on transition writes.
- **Why it matters:** Two dispatchers transitioning the same load concurrently can both succeed, skipping states or producing conflicting side effects (e.g., two TONU accessorials).
- **Fix approach:** Add `version` to the where clause on transition update (`{ id, version }`), increment on every transition. Return `ConflictError` (409) on zero-row update. Mirror the pattern already used for `Membership.permissionsVersion`.

### HIGH-06 Invoice Builder page shows "Coming Soon" (DX · feature gap)
- **File:** `hussle-app-dispatch-ui/src/features/invoices/pages/InvoiceBuilderPage/index.tsx:14`
- **Concern:** Route exists but renders placeholder; only auto-generated invoices are editable.
- **Fix approach:** Implement line-item editing UI (add/edit/remove line items, accessorial breakdown, manual override of rate). Wire to existing `updateInvoice` saga.

### HIGH-07 No OVERDUE auto-transition for invoices (data-integrity)
- **File:** `hussle-app-dispatch-api/src/invoices/services/invoiceService.ts`
- **Concern:** OVERDUE status defined but never assigned. Dashboard surfaces overdue via attention items, but invoice state stays SENT.
- **Fix approach:** Scheduled job (cron or BullMQ) that transitions SENT invoices whose `dueDate < now()` to OVERDUE. Match cadence to dashboard refresh.

### HIGH-08 Payment history overwrites instead of appending (data-integrity · audit)
- **File:** `hussle-app-dispatch-api/src/invoices/services/invoiceService.ts:154–201`
- **Concern:** `markPaid()` overwrites `paidAt`, `paymentMethod`, `paymentReference`. Partial payments lose history.
- **Fix approach:** Add `Payment` Prisma model linked to Invoice; append each payment. Keep `paidAt` as a denormalized "fully paid" timestamp.

### HIGH-12 JWT claims not rotated on role change (security)
- **Files:** `hussle-app-dispatch-api/src/auth/` (middleware + token generation)
- **Concern:** JWT carries static role; role changes don't invalidate live tokens (up to 1h stale). Schema added `Membership.permissionsVersion` but middleware doesn't validate it.
- **Fix approach:** Embed `permissionsVersion` in JWT. Validate against DB version per request (or per refresh). On mismatch, force token refresh.

### HIGH-13 No insurance expiry background check (data-integrity · ops)
- **File:** `hussle-app-dispatch-api/src/shared/onboardingGate.ts`
- **Concern:** Insurance expiry only checked at the moment of the onboarding gate. No nightly sweep.
- **Fix approach:** Nightly job: scan carriers with `insuranceExpiry < now() + 30d`, raise alert + block dispatch for expired ones.

### HIGH-14 No expired document enforcement (compliance)
- **File:** `hussle-app-dispatch-api/src/documents/services/documentService.ts`
- **Concern:** Documents have `expiresAt` but never enforced. Expired insurance/W9 stay "valid".
- **Fix approach:** Background job to flag expired docs. Update `onboardingGate` to consider doc expiry as a hard block.

### HIGH-15 Settlement PDF download button missing from UI (DX · feature gap)
- **File:** `hussle-app-dispatch-ui/src/features/accounting/pages/SettlementDetailPage/index.tsx`
- **Concern:** `GET /settlements/:id/pdf` exists; UI doesn't expose it.
- **Fix approach:** Add "Download PDF" header action — pattern matches `InvoiceDetailPage`.

### HIGH-16 No receipt upload UI for dispatchers (DX · feature gap)
- **File:** `hussle-app-dispatch-api/src/expenses/controllers/receiptController.ts` (backend done)
- **Concern:** Presign + confirm endpoints exist; UI only available via driver portal.
- **Fix approach:** Add upload button + presign flow to expense detail/edit drawer. Reuse driver-portal upload component.

### HIGH-17 Vehicle finance fields orphaned (data-integrity · feature gap)
- **File:** `hussle-app-dispatch-api/prisma/schema.prisma:669–672`
- **Concern:** `lenderName`, `loanPayment`, `loanInterestRate`, `insuranceMonthlyCost` exist on Vehicle but no UI surfaces them.
- **Fix approach:** Surface in `VehicleInfoDrawer` (finance section) or new `VehicleFinanceDrawer`. Also reconcile with the parallel `Loan` / `LoanPayment` models added later — pick one source of truth, deprecate the other.

### HIGH-18 Vehicle weekly revenue chart hardcoded empty (DX)
- **File:** `hussle-app-dispatch-ui/src/features/vehicle/components/VehicleDetailPage/VehicleOverviewTab.tsx:66`
- **Concern:** Chart data is hardcoded `[]`.
- **Fix approach:** Wire to load revenue query grouped by vehicle + week. Add backend endpoint if missing.

### HIGH-19 No driver location update endpoint (data-integrity · feature gap)
- **File:** `hussle-app-dispatch-api/src/drivers/routes/driverRoutes.ts`
- **Concern:** Driver model has `currentCity/State/Latitude/Longitude` but no `PATCH` endpoint. Deadhead calculations use stale data; UI location drawer may not persist.
- **Fix approach:** Add `PATCH /drivers/:id/location` with lat/lng/city/state. Validate via existing AWS Location reverse-geocode.

### HIGH-20 Market data requires manual push (data-integrity · feature gap)
- **File:** `hussle-app-dispatch-api/src/load-intel/services/marketDataService.ts`
- **Concern:** Market tier data only refreshes when an external system pushes; otherwise scoring uses 15-point fallback.
- **Fix approach:** Integrate with DAT/market data API for periodic refresh, or document the manual push process and warn in UI when data is stale (>24h).

### HIGH-CODE-01 Generic `Error` thrown in services / utilities (DX · standards)
- **Files (representative):** `hussle-app-dispatch-api/src/settlements/repositories/settlementRepositoryPrisma.ts:114`, `hussle-app-dispatch-api/src/shared/middleware/authenticateUser.ts:24`, `hussle-app-dispatch-api/src/shared/notifications/twilioSmsService.ts:46`, `hussle-app-dispatch-api/src/shared/routing/awsRouteCalculator.ts:27,43`, `hussle-app-dispatch-api/src/shared/storage/index.ts:56`, `hussle-app-dispatch-api/src/invoices/services/documentPacketService.ts:50`
- **Concern:** Project rule (CLAUDE.md) bans generic `Error`. Each instance bypasses the central error handler's typed mapping (404/400/409 etc.) and surfaces as 500.
- **Fix approach:** Replace with `NotFoundError`, `BadRequestError`, `ConflictError`, or a new typed error class as appropriate. Add an ESLint rule (`no-restricted-syntax` on `NewExpression[callee.name='Error']`) to prevent regression.

### HIGH-CODE-02 Yup validators don't reject unknown keys (data-integrity)
- **Files:** API-wide — every `*Validator.ts` under `hussle-app-dispatch-api/src/`
- **Concern:** Without `.strict().noUnknown()`, Yup silently drops unknown fields. The "dispatch terms field mismatch" (UI sent `companyMarginPercent`, API expected `dispatchFeePercent`) was masked exactly this way — silent zero-effect update.
- **Fix approach:** Add a shared `strictObject()` helper that applies `.strict().noUnknown()`. Migrate validators feature by feature, asserting in tests that unknown keys → 400.

### HIGH-UI-01 `any`-heavy generic CRUD framework (DX · type safety)
- **Files:** `hussle-app-dispatch-ui/src/utils/redux/createCrudSagas/types.ts` (30+ `eslint-disable @typescript-eslint/no-explicit-any`), mirror copy at `hussle-app-dispatch-ui/src/mocho/redux/createCrudSagas/types.ts`
- **Concern:** The generic CRUD framework leaks `any` through its public surface (`create?: (data: any) => Promise<TEntity>`, `update?: (id: string, data: any) => …`). Disable comments suppress the rule rather than fixing types. Anyone who imports this loses type safety on payload shape.
- **Fix approach:** Introduce a second generic parameter for the input shape: `EntityModule<TEntity, TCreateInput = Partial<TEntity>, TUpdateInput = Partial<TEntity>>`. Threads the type through `createSaga`, `updateSaga`, etc. Remove all `eslint-disable` comments in this file as the migration completes.

### HIGH-UI-02 `console.log` left in production source paths (DX · noise)
- **Files (representative):**
  - `hussle-app-dispatch-ui/src/features/carrier/store/sagas/createCarrierSaga.ts:27` (`console.log('createCarrierSaga payload', …)`)
  - `hussle-app-dispatch-ui/src/features/carrier/pages/CarrierDetailPage/index.tsx:86` (`console.log('Carrier', …)`)
  - `hussle-app-dispatch-ui/src/components/StepperForm/index.tsx:37,52` (`console.log('Submitting form', …)`, `console.log('StepperForm additionalProps', …)`)
- **Concern:** Project rule (CLAUDE.md) bans `console.log` outside test/scripts. These reach production builds, leak payload contents to browser console, and pollute the console for real bug triage.
- **Fix approach:** Remove or move behind a guarded debug logger (env-flagged). Add ESLint `no-console` (`"warn"` minimum) for `src/` excluding `scripts/`, `__tests__/`, and `*.stories.*`.

### HIGH-UI-03 Duplicate UI subtree under `src/mocho/` and `src/utils/redux/`
- **Files:** `hussle-app-dispatch-ui/src/utils/redux/createCrudSagas/` and `hussle-app-dispatch-ui/src/mocho/redux/createCrudSagas/` contain nearly identical code (same line counts, same disable-comments at identical positions).
- **Concern:** Forked codebase. Fixes will diverge silently. The bootstrap CLAUDE.md notes "`mocho-ui/` removed" — but the duplicate copy was preserved under `src/mocho/`. Same forking for hooks, reducers, components.
- **Fix approach:** Pick one canonical location (recommend `src/mocho/` since the registry treats it as the shared lib), delete the other, update imports. Or extract to a proper local workspace package.

### HIGH-FILE-01 `dat-load-scraper` is largely untyped legacy code (security · DX · tests)
- **Files:** `dat-load-scraper/src/redux/index.ts` (heavy `any` + `console.log`), `dat-load-scraper/src/utils/removeDuplicates.ts` (951 lines, every function `: any`), `dat-load-scraper/src/utils/s3.ts` (`sendJSON(message: any, options: any): Promise<any>`)
- **Concern:** This is the same package flagged for exposed AWS credentials (CRIT-01). It is also untyped, console-heavy, and has commented-out blocks. The Chrome extension is in scope for MVP (Track 10) per the plan.
- **Fix approach:** Plan-level: treat `dat-load-scraper` as an isolated rewrite candidate post-MVP. Short-term: type the load shape consumed by `pushLoadsToApi`, scrub credentials (CRIT-01), gate console behind a debug flag. Add a Jest test for the DAT push path (currently relies on `messageRouting.test.ts` only).

### HIGH-TEST-01 Test coverage gaps in invoice generation + dispatcher commission services
- **Files:** `hussle-app-dispatch-api/src/invoices/services/invoiceGenerationService.ts`, `hussle-app-dispatch-api/src/invoices/services/invoiceBuilderService.ts`
- **Concern:** MVP plan note: "No unit tests for `invoiceGenerationService` / `invoiceBuilderService` — they bypass port injection (direct Prisma in `generateSequenceNumber`). Adding tests requires refactor; defer." This is the auto-invoice generation path — the core MVP flow.
- **Why it matters:** Core MVP success criterion (load → invoice → email) has no unit coverage. Test gaps land as production bugs.
- **Fix approach:** Refactor `generateSequenceNumber` to accept an injected sequence repo port (mirroring other repos). Then mock and add tests for: customer-rate inheritance, accessorial roll-up, LEASED routing, idempotency on duplicate trigger.

---

## Medium

### MED-DB-01 SettlementLineItem repo bypasses tenant scope (security · data-integrity)
- **File:** `hussle-app-dispatch-api/src/settlements/repositories/settlementRepositoryPrisma.ts:120–131`
- **Concern:** `addLineItem` / `updateLineItem` / `deleteLineItem` take only the line item ID; rely on service layer (`settlementAdjustmentService.ts`) to verify settlement ownership first. Works today but a future dev could break it without any test catching it.
- **Fix approach:** Accept `organizationId` as parameter and scope via `settlement: { organizationId }` in repo, or have service load+verify with a typed return.

### MED-DB-02 Stop denormalizes Place address fields (data-integrity)
- **File:** `hussle-app-dispatch-api/prisma/schema.prisma:774–815`
- **Concern:** `Stop` has `facilityName/address/city/state/zip` **and** a `placeId` FK to `Place` with the same fields. Updates to Place don't propagate; queries must coalesce. `contactName/contactPhone` similarly duplicates Contact.
- **Fix approach:** Decide on intent — either (a) require `placeId`, drop denormalized columns, or (b) formalize "snapshot" semantics (Stop fields historical, Place fields current). Document choice. Large refactor.

### MED-DB-03 Enum candidates stored as String (data-integrity · drift)
- **File:** `hussle-app-dispatch-api/prisma/schema.prisma`
- **Concern:** `AccessorialCharge.billTo` (line 898) `"customer"/"carrier"` (known UI casing drift), `Carrier.authorityStatus` (551), `Document.uploadStatus` (971), `Document.reviewStatus` (977), `Invoice.paymentTerms/paymentMethod/deliveryMethod`, `Place.status`, `Settlement.paymentMethod`, `CheckCall.status`, `NotificationLog.status`.
- **Fix approach:** Promote each to a proper Prisma enum. Start with highest-drift: `billTo`, `reviewStatus`, `uploadStatus`, `paymentTerms`. One migration + code fan-out each.

### MED-DB-04 Inconsistent soft-delete pattern across models
- **File:** `hussle-app-dispatch-api/prisma/schema.prisma`
- **Concern:** Mixed patterns: Organization/Membership/Customer use `deleted Boolean + deletedAt DateTime?`; Carrier/Contact/Driver/Vehicle/Load/Place/Expense use only `deletedAt`; Invoice/Settlement/LoanPayment/NotificationLog/CheckCall/LoadStatusHistory/Stop/TruckExpense/AccessorialCharge/SettlementLineItem have no soft-delete at all.
- **Fix approach:** Drop the redundant `deleted Boolean`. Document which models are hard-only vs soft. Add partial unique indexes (`WHERE "deletedAt" IS NULL`) on business keys to support delete-and-recreate.

### MED-01 Invoice list / search not wired (DX)
- **Files:** `hussle-app-dispatch-ui/src/features/invoices/pages/InvoiceListPage/`
- **Concern:** Search field present but not wired to the saga; no accessorial line-item breakdown in detail UI. Company logo data is built into the PDF context but never rendered. Email sender hardcoded to `invoices@fleetcommand.app`.
- **Fix approach:** Wire search to filter saga. Add line-item breakdown component. Surface company logo. Move sender to env / org settings.

### MED-02 Load Management — assorted (data-integrity · DX)
- Financial field freeze enforced server-side but UI doesn't disable edit after DISPATCHED. → `LoadRateDrawer` / `LoadDetailPage` — disable fields when `FINANCIALS_LOCKED_STATUSES.includes(status)`.
- TONU amount hardcoded at $250 (`loadStatusService.ts` constant). → Move to `OrgSettings`.
- Notes required for TONU in UI but not in API. → Add to TONU validator.
- Detention de-dup: manual + auto-generated for same stop can coexist. → Unique constraint `(loadId, stopId, type='DETENTION')` partial index.
- No constraint: driver pay can exceed carrier payout. → Service-level invariant + error.

### MED-03 Load tracking is manual-only (UX · feature gap)
- No WebSocket / SSE; broker must refresh. GPS optional. Check-in not required (driver can advance status without location/notes). No geofencing. ETA not validated against appointment window. → Aligns with `project_websocket_migration` plan; defer to that work.

### MED-04 Document management gaps (security · UX)
- No virus scanning on uploaded PDFs.
- No document signing UI (signature fields in DB unused).
- Archived versions not visible.
- Presign URL TTL 15 min — slow uploads fail without retry. → Add retry on 403 by re-presigning.
- S3 keys are predictable (`org/load/type/filename`) — enumeration risk. → Add unguessable suffix (hash or UUID) to filename.

### MED-05 Notification subsystem (UX · ops)
- Carrier-onboarding-complete email rendered but never sent (TODO).
- Default "no setting = silent" is unclear.
- No retry on failed notifications.
- No rate limiting on sends. → Add per-org daily cap + per-load throttle.
- SMS defaults to console in dev (intentional but document).

### MED-06 Accounting & finance — assorted (data-integrity)
- Settlement dual-rounding: intermediate values rounded before final.
- No financial snapshot/hash for tamper detection on Invoice (`Settlement.snapshotHash` exists; Invoice equivalent missing).
- No financial freeze when Settlement approved/paid.
- Recurring expense cron job not configured.
- Expense list page hardcodes `limit: 500` with no pagination UI.

### MED-07 Carrier management — assorted (data-integrity · UX)
- No unique MC number check within org (covered by HIGH-DB-07 once that ships).
- Double approval possible (no idempotency).
- Rejection reason not persisted to Carrier record.
- Invite token stored in plaintext — should be a SHA-256 hash, plaintext returned once on creation.
- Cost-analysis phase has no backend validation.
- Carrier name field has no max length.
- Invite resend has no rate limiting.

### MED-08 Auth & user mgmt — assorted (security · UX)
- No audit logging for login/logout/org-switch (some now exist per 0.CARRY.1 — re-verify role change uses real oldRole).
- Refresh token not bound to IP / user-agent.
- Single-session mode not default.
- No invite resend / revoke UI.
- No password self-change endpoint (only forgot-flow).
- No MFA/2FA.
- Hardcoded 1h access token TTL.

### MED-09 Dashboard — assorted (perf · UX)
- Company margin: frontend expects, backend doesn't compute.
- No pagination on attention items — fetches ALL matching records.
- No caching — each visit is 8+ DB queries.
- No auto-refresh / polling.

### MED-10 Load Intelligence — perf + UX
- Chain building: sequential backhaul searches per load. → Parallelize and/or batch via single query.
- Feed filtering partially client-side. → Move filters server-side.
- Dedup hash weak — first 12 chars of SHA-256. → Use full hash or a true composite key.
- Chain cache not invalidated when loads booked/dismissed.
- No bulk dismiss/archive UI.

### MED-11 Driver / Vehicle / Customer / Contact / Place — assorted feature gaps
See audit doc for granular list — none are critical but each is a small UX gap (e.g., preferred lanes editor missing, license-expiry alerts, fuel-card provider config, customer billing config, factoring, facility hours editor).

### MED-12 `as unknown as Prisma.InputJsonValue` casts (data-integrity · type safety)
- **Files:** `hussle-app-dispatch-api/src/documents/services/documentService.ts:96`, `hussle-app-dispatch-api/src/carriers/repositories/carrierAuditPortPrisma.ts:16–17`, `hussle-app-dispatch-api/src/audit/repositories/auditLogRepositoryPrisma.ts:28–29`
- **Concern:** Project rule bans `as`. These cast typed metadata blobs through `unknown` into Prisma's JSON value — bypasses type checking on the JSON shape.
- **Fix approach:** Define a `JsonSerializable` recursive type guard and write a helper `toPrismaJson<T>(v: T): Prisma.InputJsonValue` that performs runtime validation, or use Prisma's typed JSON `@db.JsonB` with Zod-validated wrappers.

### MED-13 Legacy `getNavigate copy.ts` file
- **File:** `hussle-app-dispatch-ui/src/utils/getNavigate copy.ts`
- **Concern:** File literally named "copy" — a duplicate of `getNavigate.ts`. Filesystem cruft.
- **Fix approach:** Delete the file. Verify no imports reference the space-named copy.

### MED-14 Repository TODOs around `tenantRepositoryFactory` (DX · architecture drift)
- **Files:** `hussle-app-dispatch-api/src/auth/repositories/{invite,membership,organization,user}RepositoryPrisma.ts` each contain `// TODO: Refactor to use tenantRepositoryFactory or remove baseRepository dependency`
- **Concern:** 4 repositories flagged for cleanup. Half-built abstraction `baseRepository` is in use; intended replacement `tenantRepositoryFactory` exists. The drift increases cognitive load.
- **Fix approach:** Pick one path. If `tenantRepositoryFactory` is canonical, migrate all four and delete `baseRepository`. If not, remove the TODO and document why baseRepository remains.

---

## Low

- `Load.plannedNextLoadRef Json?` — one-off arbitrary JSON, no schema. Document or normalize. (`hussle-app-dispatch-api/prisma/schema.prisma:743`)
- `Organization.role` — overloaded term; rename to `organizationRole` or `type`. (line 29)
- `Carrier.entryMethod String?` — enum candidate (INVITE/MANUAL/IMPORT). (line 544)
- `Driver.licenseState`, `Expense.state` — should be `@db.Char(2)` like `LoadStateMiles.state`. (lines 615, 1237)
- `Vehicle.vin` — should be `@db.VarChar(17)` + check-digit validator. (line 659)
- `Settlement.totalMiles Int` vs `LoadStateMiles.miles Decimal(8,2)` — rounding drift when summing. (line 1349)
- TODOs in `hussle-app-dispatch-api/src/load-intel/adapters/fleetQueryAdapter.ts:67,70` — `currentDaysOut: 0`, `profitMargin: 15/100` placeholders. Wire to actual data.
- TODO in `hussle-app-dispatch-ui/src/features/loadintelligence/store/sagas/fetchFeedSaga.ts:9` — "Remove mock fallback once load-intel API is connected." API exists; remove fallback.
- TODO in `hussle-app-dispatch-ui/src/features/carrier/components/CreateVehicle/index.tsx:1` — entire component is `// TODO: Implement vehicle create form`. Either implement or delete the placeholder.
- TODO in `hussle-app-dispatch-ui/src/features/load/components/LoadDetailPage/NotificationTab/index.tsx:102` — "migrate to saga — notification data should flow through Redux".
- `FIXME` in `hussle-app-dispatch-api/src/driver-portal/controllers/driverPortalController.ts:16` — "Driver-uploadable document types are hard-coded. Move to org-level."
- `@deprecated` markers in `hussle-app-dispatch-ui/src/features/loadintelligence/types.ts:217,220` — `LoadIntelFeedItem` / `Location` types. Track usage and remove deprecated aliases.
- `@deprecated` on `LoadBoardPort` method in `hussle-app-dispatch-api/src/load-board/types/loadBoardPorts.ts:8` — replaced by `addIfAbsent`. Remove old method when callers migrate.
- `MED-07` migration `20260414000000_add_stop_scheduling_fields` has empty SQL file (per DB review). Reconstruct from schema history to ensure fresh-DB provisioning works.

---

## Test Coverage Gaps

### Invoice generation services (no unit tests)
- **Files:** `hussle-app-dispatch-api/src/invoices/services/invoiceGenerationService.ts`, `hussle-app-dispatch-api/src/invoices/services/invoiceBuilderService.ts`
- **Risk:** Core MVP path; bugs land in production.
- **Priority:** High — refactor `generateSequenceNumber` for injection first.

### Chrome extension push paths
- **Files:** `dat-load-scraper/src/contentScript/background.ts` (relay + DAT push handlers), `dat-load-scraper/src/contentScript/contentScript.ts`
- **Existing tests:** `__tests__/datHandler.test.ts`, `messageRouting.test.ts`, `relayMapper.test.ts`, `pushLoadsToApi.test.ts`
- **Risk:** No end-to-end test from XHR intercept → background handler → API push. Several test files use `eslint-disable @typescript-eslint/no-var-requires` indicating loose typing.
- **Priority:** Medium.

### Load status side-effect handlers
- **File:** `hussle-app-dispatch-api/src/loads/services/loadStatusService.ts` (side-effect switch in `applyStatusSideEffect`)
- **Risk:** Each `case` arm (CALCULATE_FINANCIALS, FREEZE_FINANCIALS, AUTO_GENERATE_INVOICE, AUTO_CREATE_TONU_ACCESSORIAL, CHECK_DETENTION) should have a dedicated test asserting it is fired exactly once per transition and emits the right domain event.
- **Priority:** Medium.

### Driver portal endpoints
- **Files:** `hussle-app-dispatch-api/src/driver-portal/`
- **Risk:** New surface area for MVP (status progression, check-in, document upload, expense submission). Token-auth path needs cross-tenant tests.
- **Priority:** Medium.

### Multi-tenant scoping tests
- **Risk:** With no global scoping middleware (CRIT-05), every repo needs a "user from org A cannot read entity owned by org B" test. Most repos have unit tests; few have explicit cross-tenant assertions.
- **Priority:** High — directly defends CRIT-DB-01 / CRIT-05 class of bugs.

---

## Dependencies at Risk

| Package | Concern | Mitigation |
|---------|---------|------------|
| `dat-load-scraper` AWS SDK v2 (per recent commit `844e982bb` migrated to v2) | AWS SDK v2 reaches maintenance mode 2024; AWS recommends v3. | Re-evaluate — recent commit suggests AWS Location moved from v2 to v3 in API. Confirm extension follows. |
| `express-async-errors` | Patches Express 4 to forward async errors. Will be redundant on Express 5. | Remove when migrating to Express 5. |
| `puppeteer` (invoice + settlement PDF generation) | Heavy dependency (Chromium download); cold-start latency in serverless contexts; security surface. | Consider migration to `@react-pdf/renderer` or pre-rendered HTML+`weasyprint`. |
| `formik` + `yup` | Active but increasingly out-paced by `react-hook-form` + `zod`. Yup's silent-drop behavior caused HIGH-CODE-02. | No urgent migration; harden Yup with `.strict().noUnknown()` first. |
| Redis (no client lib pinned per planning notes) | Used for sessions + cache + load-intel chain cache; failure path on Redis down not documented. | Add circuit-breaker around session lookup; degrade gracefully. |
| RabbitMQ | Same — domain event pub/sub; failure mode unclear. | Confirm subscriber retry / DLQ. Add a health check route. |
| Cognito | Single-IDP coupling; vendor lock. | Cognito is fine for MVP; document the abstraction boundary (Cognito client is wrapped in `shared/utils/cognito/`). |

---

## Fragile Areas

### Generic CRUD framework (UI)
- **Files:** `hussle-app-dispatch-ui/src/utils/redux/createCrudSagas/` + duplicate at `src/mocho/redux/createCrudSagas/`
- **Why fragile:** Heavy `any` (HIGH-UI-01), heavy generic indirection, duplicated across two paths (HIGH-UI-03). Changes here ripple across every feature module.
- **Safe modification:** Pair changes with the storybook stories in `src/mocho/redux/stories/`. Type-thread changes incrementally — never widen `any` further.

### Load detail page
- **File:** `hussle-app-dispatch-ui/src/features/dispatchboard/pages/index.tsx` (990 lines) + worktree copies
- **Why fragile:** 990-line page component, multiple drawers, conditional rendering branches. Any change risks unrelated tabs.
- **Safe modification:** Move drawer-by-drawer into dedicated files. Cover the `index.tsx` orchestration with a snapshot test before refactor.

### Create Load page
- **File:** `hussle-app-dispatch-ui/src/features/dispatchboard/pages/CreateLoadPage.tsx` (1172 lines)
- **Why fragile:** Long 4-step form with cross-step state and real-time margin calc. Easy to break margin display.
- **Safe modification:** Extract each step into its own component file. Add Cypress/Playwright coverage of the create-load happy path before splitting.

### Status transition service
- **File:** `hussle-app-dispatch-api/src/loads/services/loadStatusService.ts`
- **Why fragile:** 14-status state machine + side-effect switch + financial freeze interaction. Detention auto-generation runs from here. Concurrent transitions are unsafe (HIGH-05).
- **Safe modification:** Add optimistic-lock guard first (HIGH-05). Then any change to a side-effect should add a dedicated unit test asserting the side effect is invoked exactly once.

### Carrier service
- **File:** `hussle-app-dispatch-api/src/carriers/services/carrierService.ts`
- **Why fragile:** OWNER_OPERATOR removal was recent (Track 1). UI/API field-naming mismatch (`companyMarginPercent` vs `dispatchFeePercent`) was real and only caught manually because Yup silently dropped unknown keys. Lots of `as unknown as` casts in the update path (lines 299–301).
- **Safe modification:** Ship HIGH-CODE-02 (`.strict().noUnknown()`) before further refactor. Remove the `as` casts by typing `dispatchFeePercent` correctly through the layers.

### DAT/Relay scraper (`dat-load-scraper/`)
- **Why fragile:** Untyped (HIGH-FILE-01), exposed-creds history (CRIT-01), 951-line `removeDuplicates.ts` with no tests, commented-out code, console.log everywhere. Single point of failure for Load Intel ingest.
- **Safe modification:** Treat as legacy; do not extend without typing. Plan a rewrite milestone post-MVP.

---

## Scaling Limits

| Resource / System | Current Capacity | Limit | Path |
|-------------------|------------------|-------|------|
| Invoice list | unbounded query (CRIT-DB-02) | Memory pressure ~5k invoices/org | Paginate as in fix. |
| NotificationLog | no retention (HIGH-DB-03) | 100k+ rows/month at modest fleet size; query slowdown | Retention job + partition. |
| Dashboard | 8+ unconditional queries per page-load (MED-09) | DB CPU bound at 50+ concurrent users | Cache aggregates 30–60s. |
| Chain building (load intel) | Sequential backhaul query per load (MED-10) | UI freezes >30 loads | Parallelize / batch. |
| AuditLog | no FK on userId/orgId (HIGH-DB-04, by design) | Orphans accumulate forever | Periodic anonymization job. |
| Puppeteer PDF gen | 1 Chromium per request | Memory + cold start | Pool browsers or replace renderer. |

---

## Security Considerations Summary

| Risk | Status | Files |
|------|--------|-------|
| Cross-tenant lateral access (notification history) | **OPEN** — CRIT-DB-01 | `notificationLogRepositoryPrisma.ts` |
| Cross-tenant access via missing scoping middleware | **OPEN** — CRIT-05 | api-wide |
| CSRF | **OPEN** — CRIT-02 | `src/auth/` |
| Exposed AWS credentials in git history | **MITIGATED** — keys removed in source, but git history retains; rotation required | `dat-load-scraper/src/utils/s3.ts` |
| Predictable S3 keys (enumeration) | MED-04 | `documentService.ts` upload-key builder |
| Invite tokens stored plaintext | MED-07 | invite repo |
| JWT role claim stale on role change | HIGH-12 | auth middleware |
| No MFA | MED-08 | auth flow |
| Refresh token not bound to IP/UA | MED-08 | session repo |

---

*Concerns audit: 2026-05-13. Cross-reference `docs/audit/production-readiness-audit-2026-04-20.md` and `docs/audit/database-review-2026-04-22.md` for original detail. MVP progress against these items tracked in `docs/tasks/mvp-plan.md`.*
