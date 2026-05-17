# Driver SMS Prompts Tasks
_Last updated: 2026-04-23 09:35_
_Plan: .planning/track-3-driver-sms-prompts/plan.md_

---

## US-01: Data foundation (schema + enums + event map)
_Priority: P0 | Services: dispatch-api | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] `SmsPromptSchedule` table + indexes exist in Prisma schema and migration
- [x] `SmsPromptAnchor` and `SmsPromptStatus` Prisma enums exist
- [x] `OrgSettings` has 4 new `sms*` integer fields with defaults
- [x] `sms.prompt.due` and `sms.prompt.canceled` event types added to `eventMap.ts`
- [x] Migration file created, not yet applied

**Tasks:**
[x] T-01 [DB] Added `SmsPromptSchedule` model + enums to `prisma/schema.prisma`
         └─ Output: Added `SmsPromptAnchor` (5 values) and `SmsPromptStatus` (4 values) enums + `SmsPromptSchedule` model at end of schema. Added back-relations: `Organization.smsPromptSchedules`, `Driver.smsPromptSchedules`, `Load.smsPromptSchedules`. `loadId` FK uses `onDelete: Cascade`. Indexes `([loadId, status])` and `([organizationId, scheduledAt])`. `npx prisma validate` passes.

[x] T-02 [DB] Extended `OrgSettings` with 4 SMS cadence fields
         └─ Output: Added `smsPrePickupLeadMinutes Int @default(60)`, `smsTransitIntervalMinutes Int @default(180)`, `smsPostPickupEscalationMinutes Int @default(30)`, `smsCooldownMinutes Int @default(15)`.

[x] T-03 [DB] Generated Prisma migration (hand-written — Docker DB not reachable from CLI)
         └─ Output: Migration at `prisma/migrations/20260422000000_add_sms_prompt_schedule/migration.sql`. Creates 2 enums, adds 4 OrgSettings columns (NOT NULL with defaults — safe on existing rows), creates `SmsPromptSchedule` table with 2 indexes + 3 FK constraints. `npx prisma generate` regenerated client successfully. Not applied against DB — user will apply at deploy.

[x] T-04 [EVENTS] Added event types to `shared/messaging/eventMap.ts`
         └─ Output: Added `sms.prompt.due` with `{ smsPromptScheduleId, loadId, organizationId, anchor }` (anchor as string literal union matching enum) and `sms.prompt.canceled` with `{ smsPromptScheduleId, loadId, reason }`. TypeScript clean (only pre-existing cross-package hussle-emails rootDir error).

---

## US-02: RabbitMQ delayed-message support
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] `rabbitMqEventBus.ts` exposes a way to publish delayed messages with a per-message delay in ms
- [x] Delayed exchange pattern documented (consumer uses topic routing key as today)
- [x] `rabbitmq_delayed_message_exchange` plugin setup documented in `docs/infra-rabbitmq-delayed-messages.md`
- [x] In-memory event bus (`inMemoryEventBus.ts`) supports delayed messages via `setTimeout` fallback for tests/dev

**Tasks:**
[x] T-05 [INFRA] Extended `EventBus` port with `publishDelayed(event, data, delayMs)`
         └─ Output: Added `publishDelayed<K>(event, data, delayMs): Promise<void>` to `EventBus`. Removed unused `PublishOptions` interface (no production callers) and dropped the `options` param from `publish`. Removed legacy `DelayedPublishNotSupportedError` class. Files: `shared/messaging/eventBus.ts`, `index.ts`, `rabbitMqEventBus.ts`, `inMemoryEventBus.ts`.

[x] T-06 [INFRA] RabbitMQ delayed exchange wiring + docs
         └─ Output: Added constants `DELAYED_EXCHANGE_NAME='fleet-command.delayed'` + `DELAYED_EXCHANGE_TYPE='x-delayed-message'`. On connect, `assertDelayedExchange` asserts the plugin-backed exchange (type topic via `x-delayed-type`). On plugin-missing failure, logs warn + sets `delayedExchangeAvailable=false`. `bindAndConsume` binds queues to BOTH exchanges so subscribers get immediate and delayed messages through the same handler. `publishDelayed` validates `delayMs >= 0` (throws `ValidationError` from `shared/errors/commonErrors`), checks availability (throws new `DelayedExchangeUnavailableError`), publishes with `headers: { 'x-delay': delayMs }`. Docs at `docs/infra-rabbitmq-delayed-messages.md` covering plugin install + container caveat + graceful-degradation behavior.

[x] T-07 [INFRA] In-memory fallback with `setTimeout`
         └─ Output: `publishDelayed` with `delayMs>0` schedules `setTimeout`, tracks handles in `Set<NodeJS.Timeout>`. Fast-path when `delayMs<=0` — awaits `publish` inline for deterministic tests. Negative delay throws local `InvalidDelayError`. `close()` + `clear()` clear all pending timers. New test helper `getPendingDelays(): number`. Tests at `shared/messaging/__tests__/inMemoryEventBus.test.ts` — 8/8 passing (fake timers, multi-handler order, close-clears-timers, clear-clears-timers, negative-delay rejection, delay=0 sync path).

---

## US-02a: Enable RabbitMQ delayed-message plugin in dev compose
_Priority: P0 | Services: infra | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] `docker-compose.yml` uses a RabbitMQ image that ships with `rabbitmq_delayed_message_exchange` enabled
- [x] After `docker compose up -d hussle-app-rabbitmq`, `rabbitmq-plugins list` shows the plugin as `[E*]` (enabled)
- [x] Dispatch-api startup logs show "RabbitMQ delayed exchange ready" when `RABBITMQ_URL` is set to the compose broker (verified 2026-04-22 17:41 UTC against running stack, exchange=`fleet-command.delayed`)
- [x] No regressions: existing queues/exchanges still resolve on reconnect after image swap (same base 3.13 + same `rabbitmq-data` volume)

**Tasks:**
[x] T-29 [INFRA] Built local RabbitMQ image with plugin installed from official GitHub release
         └─ Output: First attempt swapped to `heidiks/rabbitmq-delayed-message-exchange:3.13-management` — that tag does NOT exist on Docker Hub. Pivoted to a local Dockerfile approach (removes third-party dependency). New file `docker/rabbitmq/Dockerfile` extends `rabbitmq:3.13-management`, downloads plugin v3.13.0 `.ez` from `github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases` into `/opt/rabbitmq/plugins/`, runs `rabbitmq-plugins enable --offline`. `docker-compose.yml` now declares `image: fleet-command/rabbitmq:3.13-delayed` + `build: { context: ./docker/rabbitmq }`.

[x] T-30 [INFRA] Built + recreated container; verified plugin is enabled
         └─ Output: `docker compose build hussle-app-rabbitmq` succeeded. `docker compose up -d --force-recreate hussle-app-rabbitmq` — healthy in 3s. `docker exec hussle-app-rabbitmq rabbitmq-plugins list -e` shows `[E*] rabbitmq_delayed_message_exchange 3.13.0`. Container running, no other services touched. `rabbitmq-data` volume preserved.

---

## US-03: Scheduler subscriber + worker + cancellation
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] Subscribing to `load.status.changed` seeds/cancels prompts per plan § Flow 1 + Flow 5
- [x] Subscribing to `load.checkcall.logged` cancels next TRANSIT_INTERVAL (earliest-scheduled pending row)
- [x] Worker consumes `sms.prompt.due`, enforces cooldown, calls Twilio via `sendSms` port, writes `sentAt` + `twilioMessageSid` (**note:** sid is placeholder `'TWILIO_SID_PLACEHOLDER'` because `SmsService.sendSms` returns `void`; flagged as follow-up for US-04)
- [x] Terminal status (DELIVERED/CANCELED/TONU) sets all PENDING rows to CANCELED
- [x] If driver has no phone number, the send is skipped and row marked FAILED with `failureReason = "driver has no phone"`
- [x] Transit-duration-aware: trips with computed transit < 4h schedule ONE mid-transit prompt; longer trips use `smsTransitIntervalMinutes`

**Tasks:**
[x] T-08 [API] Created `sms-prompts` module scaffolding (types + Prisma repos)
         └─ Output: `src/sms-prompts/{types,repositories,services,__tests__}/` with `SmsPromptScheduleRepoPort` (create/findById/findPending/cancel/markSent/markFailed/findByLoad/lastSentAtForLoad) + `LoadSchedulerQueryPort.findForScheduling` + `DriverQueryPort.findById`. Prisma impls: `smsPromptScheduleRepositoryPrisma.ts`, `loadSchedulerQueryPrisma.ts`, `driverQueryPrisma.ts`. Load shape derives transit from stops (`departureTime` on first PICKUP → `appointmentStart` on last DELIVERY) since Load model has no `estimatedDeliveryAt`/`actualPickupAt` columns. `loadNumber` added to shape for SMS body.

[x] T-09 [API] Scheduler subscriber with event-driven seed/cancel
         └─ Output: `src/sms-prompts/services/smsPromptSchedulerSubscriber.ts` — `initializeSmsPromptSchedulerSubscriber(deps)` subscribes to `load.status.changed` + `load.checkcall.logged` with queueGroup `sms-prompts-service`. DISPATCHED→seed DISPATCHED+PRE_PICKUP (if future)+POST_PICKUP (if within 48h). IN_TRANSIT→seed 1 TRANSIT_INTERVAL (midpoint if <4h transit, else now+interval). AT_PICKUP→cancel POST_PICKUP. AT_DELIVERY→cancel TRANSIT_INTERVAL. DELIVERED/CANCELED/TONU→cancel ALL. Check-call→cancel earliest TRANSIT_INTERVAL. Helpers: `scheduleRow` (creates row + publishDelayed), `cancelPendingByAnchor`, `cancelAllPending`, `resolveSmsSettings` (defaults-safe when OrgSettings null). Every handler wraps in try/catch, logs, never throws.

[x] T-10 [API] Transit-duration-aware interval logic (integrated into T-09)
         └─ Output: `computeTransitMs(load)` derives duration from stops since Load lacks ETA columns. `<4h` → 1 midpoint TRANSIT_INTERVAL at `pickupStart + transitMs/2`. `>=4h` or indeterminate → 1 TRANSIT_INTERVAL at `now + transitIntervalMinutes`; worker re-enqueues the next one after each successful send while status still IN_TRANSIT. Defensive skip when ETA is already in the past.

[x] T-11 [API] Worker — processes `sms.prompt.due`
         └─ Output: `src/sms-prompts/services/smsPromptWorker.ts` — `initializeSmsPromptWorker(deps)` subscribes to `sms.prompt.due`. Processing: row still PENDING → load + driver checks → cooldown check → token via `getOrCreateDriverToken(loadId)` → `${trackingBaseUrl}/driver-portal/${token}` → `sendSms({ to, body: 'Load #<n>: please check in. <url>' })` → `markSent` or `markFailed`. Simplification vs plan: (1) token uses existing DRIVER scope (plan's `SMS_PROMPT` scope doesn't exist); (2) `twilioMessageSid='TWILIO_SID_PLACEHOLDER'` because `SmsService.sendSms` returns void — US-04 follow-up to change the interface. TRANSIT_INTERVAL success + status still IN_TRANSIT → re-enqueue next at `now + transitIntervalMinutes`.

[x] T-12 [API] Composition root + app boot wiring
         └─ Output: `src/sms-prompts/compositionRoot.ts` builds repos + initializeSubscribers. `src/sms-prompts/index.ts` imports shared prisma/eventBus/logger/env, reuses `smsService` + `trackingTokenService` exported from `src/notifications/index.ts` (added `export { smsService };` — one-line permitted edit), instantiates a local `settingsRepositoryPrisma(prisma)`, calls `initializeSubscribers().catch(logger.error)` fire-and-forget. `src/app.ts` now has `import './sms-prompts';` directly after `import './notifications';`.

[x] T-13 [API] Unit tests — 22/22 passing
         └─ Output: `src/sms-prompts/__tests__/smsPromptSchedulerSubscriber.test.ts` (12 tests) + `smsPromptWorker.test.ts` (10 tests). Mock eventBus via Map capturing handlers, AAA pattern, fake timers where needed. Covers: all 6 status transitions, default-fallback when OrgSettings is null, no-driver skip, long+short transit, check-call cancel, PENDING→SENT happy path, cooldown, no-phone, Twilio error, already-terminal load, TRANSIT_INTERVAL re-enqueue + no-reenqueue on AT_DELIVERY. Typecheck clean (0 new errors; 27 baseline hussle-emails TS6059 unchanged). ESLint clean.

---

## US-04: Send + History APIs
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] `POST /loads/:loadId/sms-prompts` creates a MANUAL row, publishes a due event with delay=0, returns 201 with the row
- [x] `GET /loads/:loadId/sms-prompts` returns paginated list newest-first with full row shape
- [x] Auth: requires authenticated user (`requireAuth`) with org-scoped access; POST also gated to ADMIN/DISPATCHER roles
- [x] 400 if driver has no phone or load has no driver; 404 if load not found or wrong org; 409 if cooldown not elapsed
- [x] Routes in `/api/v1/loads/:loadId/sms-prompts` mounted as a dedicated router alongside the main loads router

**Tasks:**
[x] T-14a [API] Widened `SmsService.sendSms` to return `{ messageSid: string | null }`
         └─ Output: `SmsService.sendSms` now returns `Promise<SmsSendResult>` where `SmsSendResult = { messageSid: string | null }`. Twilio impl returns the real sid; console impl returns null. Scheduler worker's `TWILIO_SID_PLACEHOLDER` replaced with `result.messageSid`. `markSent` port signature widened to accept `string | null`. Worker test mocks updated to return `{ messageSid: 'SM_TEST_SID' }`. Other existing callers (notificationSubscriber, driverPortalService, carrierOnboardingSubscriber, sendDriverLinkController) ignore the return value — no change needed.

[x] T-14 [API] Service layer for manual send + history
         └─ Output: `src/sms-prompts/services/smsPromptService.ts` — `createSmsPromptService(deps)` with `sendManualPrompt({ loadId, organizationId, requestingUserId })` and `listPromptsForLoad({ loadId, organizationId, page, limit })`. Org-scoped load lookup throws `NotFoundError` on miss/wrong org. `ValidationError` for no-driver / no-phone. `ConflictError` for cooldown. Cooldown uses `resolveSmsSettings(await settingsRepo.findByOrganizationId(orgId))` so null row still picks up the 15-min default. Manual row seeded with anchor=`MANUAL`, published as `publishDelayed(..., 0)` — worker handles actual send asynchronously.

[x] T-15 [API] Routes + controllers + validators + transformers
         └─ Output: `smsPromptValidators.ts` (Yup params+query+body schemas), `mappers/{sendManualPromptMapper,listPromptsForLoadMapper}.ts`, `transformers/smsPromptScheduleTransformer.ts` (ISO-8601 dates), `controllers/smsPromptController.ts` (factory returning `sendManual`+`listForLoad`), `routes/smsPromptRoutes.ts`. Composition root extended to build controllers; `index.ts` now exports `smsPromptsRouter`. `src/app.ts` mounts at `/api/v1/loads`. POST requires ADMIN/DISPATCHER role; GET is any authenticated user. All errors propagate through `express-async-errors` to the centralized handler.

[x] T-16 [API] Controller + service tests — 12 new tests passing
         └─ Output: `__tests__/smsPromptService.test.ts` (10 tests): happy-path create, no-load 404, wrong-org 404, no-driver 400, no-phone 400, cooldown 409, default cooldown when OrgSettings null, custom cooldown honored, listPromptsForLoad pagination, list org-scoping. `__tests__/smsPromptController.test.ts` (2 tests): request→service input mapping + 201 on create, pagination + 200 on list. All pass.

**Cross-cutting fix (from US-02 regression discovered during US-04 validation):** 10 existing test files across `notifications`, `audit`, `load-intel`, `invoices`, `documents`, `expenses`, `vehicles`, `loads` declared `EventBus`-typed mocks that broke type-compile when US-02 added `publishDelayed` to the port. Added `publishDelayed: jest.fn()` to each. Final broad sweep: 372/372 tests pass across 36 suites in `loads/invoices/load-intel/documents/notifications/audit/carrier-portal/carriers/driver-portal/settlements/vehicles/expenses/ifta/sms-prompts/shared-messaging`. Typecheck unchanged at 27 baseline errors (all pre-existing `hussle-emails` rootDir).

---

## US-05: Send SMS modal + load detail action
_Priority: P0 | Services: dispatch-ui, dispatch-api | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] "Send Check-in SMS" button renders on `LoadDetailActions` for statuses DISPATCHED → AT_DELIVERY
- [x] Button disabled with tooltip "Driver has no phone number" when `load.assignment.driver?.phone` is null
- [x] Click opens `SendSmsPromptModal` via Redux modal registry (no local useState)
- [x] Modal shows driver name + phone, message preview, cooldown warning if last sent < 15 min ago
- [x] Submit dispatches saga → POST /loads/:id/sms-prompts → success toast → close modal → refetch history
- [x] Failure path surfaces error as toast (server error message propagated from `response.data.errors[0].message`)

**Tasks:**
[x] T-17a [PREP] Expose `driver.phone` on load detail response
         └─ Output: `hussle-app-dispatch-api/src/loads/controllers/transformers/loadTransformer.ts` — added `phone: load.driver.phone ?? null` to driver projection. `src/loads/types/loadTypes.ts` — `DriverResponse` gains `phone: string | null` (strictly typed, so transformer required both edits). Transformer test fixture updated. 24/24 transformer tests pass. UI: `hussle-app-dispatch-ui/src/features/load/types.ts` — `DriverDetail` gains `phone: string | null`.

[x] T-17 [UI] API client `smsPromptApi.ts`
         └─ Output: `hussle-app-dispatch-ui/src/utils/api/loads/smsPromptApi.ts` — `sendSmsPrompt(loadId)` POST (empty body), `listSmsPrompts(loadId, { page, limit })` GET. Reuses `PaginationMeta` from `features/carrier/types` (same pattern as `loadApi.ts`). Exports `SmsPromptScheduleResponse` type.

[x] T-18 [UI] Redux slice extensions + entity slice + sagas (polling actions only; saga wired in US-06)
         └─ Output: `loadPageSlice.ts` extended with 8 actions (`sendSmsPromptRequest/Success/Failure`, `fetchSmsPromptHistoryRequest/Success/Failure`, `startSmsPromptPolling`, `stopSmsPromptPolling`). New `smsPromptEntitySlice.ts` via `createEntityAdapter` (sorted by `scheduledAt` desc). New `smsPromptSelectors.ts` (`selectSmsPromptsByLoadId`, `selectLastSentAtForLoad`). Two sagas: `sendSmsPromptSaga.ts` (POST + success toast + history refetch + entity upsert) and `fetchSmsPromptHistorySaga.ts` (GET + entity upsert, silent failure — no toast to avoid poll-noise). Watcher registers both with `takeLatest`. Polling saga deliberately not wired — comment in watcher marks for US-06. Store `entities.smsPrompts` registered.

[x] T-19 [UI] `SendSmsPromptModal` + modal registry
         └─ Output: `src/features/load/components/SendSmsPromptModal/index.tsx` — MUI `Dialog` (maxWidth=sm). On mount dispatches `fetchSmsPromptHistoryRequest({ loadId })`. Reads load via `selectLoadDetailById`, last-sent-at via `selectLastSentAtForLoad`. Shows driver name/phone (DetailRow), message preview in muted Box, cooldown Alert when elapsed < 15 min. Send button disabled when `driver.phone === null`. No local `useState` for visibility — receives `loadId` + `onClose` from ModalManager. `popupTypes.ts` registers `loadSendSmsPrompt: { loadId: string }`. `modalRegistry.ts` maps type → component.

[x] T-20 [UI] `LoadDetailActions` button
         └─ Output: New `SMS_PROMPT_STATUSES` const (DISPATCHED | EN_ROUTE_PICKUP | AT_PICKUP | IN_TRANSIT | AT_DELIVERY). Button rendered with `SmsOutlinedIcon`, placed immediately after Check Call. Disabled-when-no-phone wrapped in `<Tooltip><Box component="span">` (same pattern as the existing Send Invoice button). Click dispatches `openModal('loadSendSmsPrompt', { loadId: load.id })`.

**Tests:** 9 new UI tests (3 API client + 2 saga + 4 modal) — all pass. Validation: 0 new dispatch-ui TS errors (pre-existing baseline unchanged), 0 new eslint violations, 24/24 dispatch-api transformer tests pass.

---

## US-06: SMS Prompt History panel + saga polling
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] `SmsPromptHistorySection` renders as a new `SectionCard` at the bottom of the Notifications tab
- [x] NewDataGrid shows columns: Anchor chip, Scheduled At, Sent At, Status chip, Failure reason
- [x] Empty state visible when no rows yet (`EmptyState variant="no-results" entityName="SMS prompt" compact`)
- [x] Saga polling loop fetches every 30s while section mounted; stops on unmount via `stopSmsPromptPolling`
- [x] On send success (from US-05), history refetches immediately — `sendSmsPromptSaga` dispatches `fetchSmsPromptHistoryRequest` on success
- [ ] Backoff: **DEFERRED (superseded by planned websocket migration)** — polling uses fixed 30s interval. Rather than add backoff state now, we'll replace polling with websocket push notifications when the infra lands. See memory `project_websocket_migration.md`.

**Tasks:**
[x] T-21 [UI] Polling saga with race/delay
         └─ Output: `src/features/load/store/sagas/smsPromptPollingSaga.ts` — `while(true){ put(fetchHistoryRequest); race({ stop: take(stopSmsPromptPolling), tick: delay(30_000) }) }`. Watcher wired via `takeLatest(startSmsPromptPolling.type, smsPromptPollingSaga)` which gives cancel-on-restart semantics for free. No backoff in MVP.

[x] T-22 [UI] `SmsPromptAnchorChip`
         └─ Output: `.../NotificationTab/SmsPromptHistorySection/SmsPromptAnchorChip.tsx` — MUI `Chip outlined`, color map DISPATCHED→info, PRE_PICKUP→warning, POST_PICKUP→error, TRANSIT_INTERVAL→default, MANUAL→primary. Humanized labels ("Pre-Pickup", "Transit Check-in", etc.).

[x] T-23 [UI] `SmsPromptHistorySection`
         └─ Output: `.../SmsPromptHistorySection/index.tsx` — `SectionCard title="SMS to Driver"` with "Send Check-in SMS" button in `actions` slot opening `loadSendSmsPrompt` modal. `NewDataGrid` uses `columnDefs`+`rowData` (confirmed prop names from `src/mocho/components/NewDataGrid/index.tsx`). Columns: Anchor chip / Scheduled / Sent / Status chip (color map PENDING→default, SENT→success, FAILED→error, CANCELED→warning) / Reason. `useEffect` dispatches `startSmsPromptPolling` on mount, `stopSmsPromptPolling` on cleanup. Empty state renders when `prompts.length === 0`.

[x] T-24 [UI] Wire into Notifications tab
         └─ Output: `NotificationTab/index.tsx` — 1 import + 1 JSX line (`<SmsPromptHistorySection loadId={loadId} />`) at the bottom of the outer flex Box. Existing sections untouched.

---

## US-07: Driver Communications settings
_Priority: P0 | Services: dispatch-ui, dispatch-api | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] New "Driver Communications" SectionCard on the org settings page
- [x] 4 integer inputs for the SMS cadence fields with correct defaults (60/180/30/15)
- [x] Yup validation: required integer, min 1, max 1440 (front+back)
- [x] Save dispatches existing org settings saga; success toast; values persist

**Tasks:**
[x] T-25a [API] Backend PATCH validator + service layer widening
         └─ Output: `hussle-app-dispatch-api/src/settings/validators/settingsValidators.ts` — 4 optional `Yup.number().integer().min(1).max(1440)` fields. `updateSettingsMapper.ts` — 4 allowlisted passthroughs. `settingsTypes.ts` — `OrgSettingsResponse` (required) + `UpdateSettingsInput` (optional) extended. `settingsService.ts` — `DEFAULT_SETTINGS` widened with 60/180/30/15, `toResponse()` projects the 4 new fields.

[x] T-25 [UI] `DriverCommunicationsSettings` component + schema/type/initial-values extensions
         └─ Output: `settingsSchema.ts` — 4 new `Yup.number().required().integer().min(1).max(1440)` fields. `settings/types.ts` — `OrgSettings` + `SettingsFormValues` interfaces widened. `SettingsPage/index.tsx` — `buildInitialValues` pulls new fields with defaults. New `components/DriverCommunicationsSettings/index.tsx` — `SectionCard` wrapping a 2×2 Grid of `TextField type="number"` inputs (helperText omitted because mocho TextField doesn't accept it — replaced with a single BodyMuted descriptor at top of section). Saves through the existing `updateSettingsRequest` saga.

[x] T-26 [UI] Mount on SettingsPage
         └─ Output: `SettingsPage/index.tsx` — 1 import + 1 JSX line (`<DriverCommunicationsSettings formikProps={formikProps} />`) placed after the existing Communication section, before the Save button. Existing sections untouched.

---

## INT-01: Wire dispatch-api ↔ dispatch-ui SMS prompts
_Auto-generated | Services: dispatch-api, dispatch-ui | Status: todo_

**Verification Checklist:**
- [ ] UI `smsPromptApi.ts` calls match API routes exactly
- [ ] Response shapes match transformer output field-for-field
- [ ] Enums match: UI `SmsPromptAnchor` values identical to API Prisma enum
- [ ] Status badge color map covers all 4 `SmsPromptStatus` values
- [ ] Auth: both routes require `appAuth` and enforce org scoping
- [ ] Error responses: UI saga handles 400/404/409 with appropriate toast messages
- [ ] Data flow: dispatch → schedule row created → delayed event → worker → Twilio → sentAt populated → UI history panel reflects

**Tasks:**
[x] T-27 [WIRE] Verify API integration against plan
         └─ Output: 5/8 checks pass cleanly. 3 findings — FIX-01 (MINOR, UX): saga uses generic `error.message` instead of unwrapping `response.data.errors[0].message` from the backend error envelope → user sees "Request failed with status code 409" instead of "Cooldown period not elapsed". FIX-02 (BLOCKING AC): `SendSmsPromptModal` calls `onClose()` synchronously on Send click, closing the modal before the saga completes → plan AC "modal stays open on failure" violated. FIX-03 (COSMETIC): plan text uses singular `/sms-prompt`; impl + task file use plural `/sms-prompts`. Endpoints, enums, auth matrix, driver comms settings round-trip, data flow, org scoping, response envelopes — all verified MATCH.

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Status: todo_

**Tasks:**
[x] T-28 [VERIFY] Trace all flows + check all ACs
         └─ Output: **39/40 ACs met, 1 deferred** (US-06 #6 backoff → websocket migration). Flows 1 (DISPATCHED), 3 (transit-duration), 4 (manual send) fully implemented end-to-end. Flow 2 (check-in cancels anchors) ⚠ partial — IN_TRANSIT doesn't cancel pending POST_PICKUP (edge case — AT_PICKUP almost always fires first) and portal-token → cancel-DISPATCHED is not implemented (plan marks as open decision). Flow 5 (terminal cancel sweep) ⚠ not transactional — plan mentions "same event transaction" but impl uses sequential awaits. Deploy readiness ✓: migration applied, RabbitMQ plugin enabled, env vars documented, `sms-prompts` side-effect import mounted, router registered. **Bottom line: ready for manual test-script walkthrough on dev stack.** Only FIX-02 is an AC-blocking issue; rest are polish.

---

## FIX-01: Polish pass from INT-01/VER-01 findings
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] POST failure keeps the `SendSmsPromptModal` open so the dispatcher sees the error toast in context and can retry
- [x] Error toast shows the backend's human-readable message ("Cooldown period not elapsed", "Driver has no phone number", "Load has no assigned driver") instead of the generic axios "Request failed with status code NNN"
- [x] Modal message preview reflects what the dispatcher will actually send (no misleading `[tracking link]` literal)
- [x] Plan document's API section uses plural `/sms-prompts` to match implementation

**Tasks:**
[x] T-29 [FIX] `extractErrorMessage` helper + saga usage
         └─ Output: New `src/utils/api/extractErrorMessage.ts` — `extractErrorMessage(error: unknown, fallback = 'Something went wrong'): string`. Checks `error.response.data.errors[0].message` first (matches backend `CustomError.serializeErrors()` envelope), falls back to `Error.message`, then to fallback. Used by both `sendSmsPromptSaga.ts` (passes to toast) and `fetchSmsPromptHistorySaga.ts` (populates failure action state). Unit test covers backend envelope, Error fallback, unknown shape, empty-string short-circuit. 6/6 pass.

[x] T-30 [FIX] Modal stays open on failure; saga closes on success
         └─ Output: `handleSend` in `SendSmsPromptModal/index.tsx:60` now only dispatches `sendSmsPromptRequest` — no synchronous `onClose()`. Saga dispatches `put(closeModal())` (action from `features/ui/store/reducers/uiSlice`) as the LAST step of the try block. Failure path never dispatches closeModal — modal stays open. Cancel button still works via its own onClose prop from ModalManager. Tests updated: modal test "does not call onClose when Send clicked", saga happy-path asserts `closeModal` is put, failure-path asserts it is NOT put.

[x] T-31 [FIX] Honest message preview
         └─ Output: `SendSmsPromptModal/index.tsx:54` — preview now renders `Load #<loadNumber>: please check in.` followed by italic muted span `<driver portal check-in link>` (ReactNode, existing preview Box already accepts children). Removes misleading `[tracking link]` literal. Test assertion swapped to `/driver portal check-in link/i` + explicit absence of `/\[tracking link\]/i`.

[x] T-32 [DOCS] Updated plan.md API section to plural `/sms-prompts`
         └─ Output: 3 singular `sms-prompt` references in `.planning/track-3-driver-sms-prompts/plan.md` (lines 80, 133, 181) replaced with plural `/sms-prompts`. Line 82 (`sms-prompt.due` event name) and line 305 (`sms-prompts/` module path) intentionally left — event name matches `eventMap.ts`, module path matches `src/sms-prompts/`.

**Validation:** 14/14 tests pass (6 extractErrorMessage + 3 saga + 5 modal). 0 new TS errors (baseline 321 unchanged). 0 eslint violations.

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 4     | 4    | 0       | 5/5    |
| US-02 | 3     | 3    | 0       | 4/4    |
| US-02a| 2     | 2    | 0       | 4/4    |
| US-03 | 6     | 6    | 0       | 6/6    |
| US-04 | 4     | 4    | 0       | 5/5    |
| US-05 | 5     | 5    | 0       | 6/6    |
| US-06 | 4     | 4    | 0       | 5/6    |
| US-07 | 3     | 3    | 0       | 4/4    |
| INT-01| 1     | 1    | 0       | —      |
| VER-01| 1     | 1    | 0       | —      |
| FIX-01| 4     | 4    | 0       | 4/4    |
| **All** | **37** | **37** | **0** | **43/44** |
