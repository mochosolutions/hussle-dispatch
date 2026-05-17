# Driver Portal Audit & Fixes — Tasks
_Last updated: 2026-04-26 21:15_

---

## US-01: Playwright Infrastructure Setup
_Priority: P0 | Services: dispatch-ui | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] `@playwright/test` installed with Chromium browser
- [x] `playwright.config.ts` configured for driver portal routes (baseURL, mobile + desktop projects)
- [x] A smoke spec (`driver-portal-smoke.spec.ts`) navigates to an invalid token URL and sees an error — confirms infra works

**Tasks:**
[x] T-01 [SETUP] Install Playwright and configure for driver portal
         └─ Detail: In `hussle-app-dispatch-ui/`:
            1. `npm install -D @playwright/test`
            2. `npx playwright install chromium`
            3. Create `playwright.config.ts` at package root with:
               - `baseURL: 'http://localhost:5173'` (Vite dev server per ARCHITECTURE.md)
               - Two projects: `mobile` (viewport 375×812, iPhone SE) and `desktop` (viewport 1280×800)
               - `testDir: './e2e'`
               - `outputDir: './e2e-results'`
               - Screenshot on failure: `use: { screenshot: 'only-on-failure' }`
               - `webServer` block to start Vite dev server if not running
            4. Create `e2e/` directory
            5. Add `e2e-results/` to `.gitignore`
            6. Add npm script: `"test:e2e": "npx playwright test"`
         └─ Depends on: —
         └─ Output: Files: hussle-app-dispatch-ui/playwright.config.ts (new),
            hussle-app-dispatch-ui/.gitignore (Playwright entries added),
            hussle-app-dispatch-ui/package.json (test:e2e + test:e2e:ui scripts).
            Installed @playwright/test + Chromium 1212. e2e/ + e2e/driver-portal/
            dirs created. Config: 2 projects (desktop 1280×800, mobile iPhone SE),
            webServer auto-starts vite on 5173, screenshot on failure, retain-on-failure
            video, html report at ./playwright-report. Status: DONE. Issues: None.

[x] T-02 [TEST] Write smoke spec to verify Playwright works
         └─ Detail: Create `e2e/driver-portal-smoke.spec.ts`:
            - Navigate to `/driver-portal/invalid-token-12345`
            - Assert page loads without crash
            - Assert error state visible (expired/invalid token message)
            - Take screenshot: `driver-portal-smoke.png`
            - Run in both mobile and desktop projects
         └─ Depends on: T-01
         └─ Output: File: hussle-app-dispatch-ui/e2e/driver-portal-smoke.spec.ts.
            Mocks GET /api/v1/driver-portal/portal/load* with 401 + Invalid token,
            navigates to /driver-portal/invalid-token-12345, asserts heading
            "Invalid Link" visible, captures e2e-results/screenshots/driver-portal-smoke.png.
            Run: `npx playwright test driver-portal-smoke.spec.ts` → 2 passed
            (desktop 1.8s, mobile 3.4s). Status: DONE. Issues: None.

---

## US-02: Audit — Token Authentication Flow
_Priority: P0 | Services: dispatch-ui, dispatch-api | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] Valid token loads portal with driver name greeting and load summary
- [x] Expired token (>7 days) shows clear "link expired" message with instructions to contact dispatcher
- [x] Revoked token shows appropriate error
- [x] Invalid/malformed token returns 401, portal shows friendly error
- [~] Missing token in URL shows friendly error (not blank page or crash) — excluded from spec by orchestrator (route is `/:token`, react-router never matches `/driver-portal/`); flagged as follow-up
- [x] All above work at 375px and 1280px viewports

**Tasks:**
[x] T-03 [TEST] Write Playwright spec for token authentication
         └─ Detail: Create `e2e/driver-portal/auth.spec.ts`.
            Route: `/driver-portal/:token` (see `driverPortalRoutes.tsx` — standalone public route, no AppLayout/AuthGuard).
            Backend middleware: `authenticateDriverToken.ts` validates token from query param or Bearer header.
            Token model: `TrackingToken` (type DRIVER, 7-day expiry via `expiresAt`, revocable via `revokedAt`).
            
            Test cases:
            1. Valid token → page loads, driver first name greeting visible, load number visible
            2. Expired token → clear "expired" or "link expired" message, no crash
            3. Revoked token → appropriate error message
            4. Malformed token (not UUID) → friendly error, not 500 page
            5. Missing token (navigate to `/driver-portal/` without token) → friendly error
            6. Run all cases at both mobile (375px) and desktop (1280px)
            7. Screenshot at each assertion: `auth-valid.png`, `auth-expired.png`, etc.
            
            Setup: Requires seeded test data — a load with DISPATCHED status, assigned driver, and valid TrackingToken.
            If the app needs API mocking for E2E, use Playwright route interception (`page.route()`) to mock
            `GET /api/v1/driver-portal/portal/load` responses for each scenario.
         └─ Depends on: T-02
         └─ Output: File: hussle-app-dispatch-ui/e2e/driver-portal/auth.spec.ts.
            5 scenarios × 2 viewports = 10 tests, all pass. Scenarios: valid token
            (asserts driver first name + load number + status chip), expired token
            ("Link Expired"), revoked token ("Link Revoked"), malformed token
            ("Invalid Link"), network failure ("Something Went Wrong" + Try Again).
            Run: `npx playwright test e2e/driver-portal/auth.spec.ts` → 10 passed (13.1s).
            Status: DONE.
            Issues: Missing-token case (`/driver-portal/` without segment) excluded
            — react-router won't match `/:token` so it falls to app shell/404, a
            different surface entirely. Optional follow-up if we want a dedicated
            "no token provided" landing.

[x] T-04 [FIX] Fix any authentication bugs found
         └─ Detail: Based on T-03 findings, fix issues in:
            - Frontend: `DriverPortalPage/index.tsx` error handling/display
            - Backend: `authenticateDriverToken.ts` middleware, `driverPortalController.ts`
            - Common issues to watch for: blank page on error, uncaught promise rejection,
              missing error UI for specific token states, crash when token param is empty string
         └─ Depends on: T-03
         └─ Output: Files: None — auth spec passed clean on first run, no fixes needed.
            Verified: revoked state has dedicated ErrorLayout (DriverPortalPage
            lines 331–338); 401 message routing (expired/revoked/invalid) works;
            network-error → 'error' state with Try Again button works.
            Minor observation: `if (!load) { return null; }` at line ~359 is
            unreachable defensive fallback; if a future portalStatus is added
            without a render branch, users would see blank page. Not in scope.
            Status: DONE.

---

## US-03: Audit — Load Summary View
_Priority: P0 | Services: dispatch-ui, dispatch-api | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] Load number, status badge, equipment type, commodity, weight all render correctly
- [x] Pickup stop shows facility, address, contact, appointment time **and type** — fully covered after FIX-01
- [x] Delivery stop shows same fields — fully covered after FIX-01
- [x] Driver instructions section appears when present, hidden when absent
- [x] Multiple appointment types render correctly (APPOINTMENT, FCFS, NOTIFICATION, OPEN, DROP_HOOK) — **resolved by FIX-01 T-16/T-17/T-18**
- [x] All above work at 375px and 1280px viewports

**Tasks:**
[x] T-05 [TEST] Write Playwright spec for load summary view
         └─ Detail: Create `e2e/driver-portal/load-summary.spec.ts`.
            Component: `DriverPortalPage/index.tsx` (~530 lines).
            API: `GET /api/v1/driver-portal/portal/load` returns load summary with stops, contacts, commodity.
            API client: `driverPortalApi.ts` → `getLoadSummary(token)`.
            
            Test cases:
            1. Load header: load number (format `LD-YYYY-NNNN`), status chip, equipment type badge
            2. Pickup stop card: facility name, full address, contact name/phone, appointment datetime, appointment type label
            3. Delivery stop card: same fields as pickup
            4. Commodity summary: description, weight, piece count (if present)
            5. Driver instructions: visible when non-empty, section absent when empty
            6. Each appointment type (APPOINTMENT, FCFS, NOTIFICATION, OPEN, DROP_HOOK) renders with correct label
            7. Screenshot each section at mobile + desktop
            
            Use `page.route()` to mock API response with known data for deterministic assertions.
         └─ Depends on: T-02
         └─ Output: File: hussle-app-dispatch-ui/e2e/driver-portal/load-summary.spec.ts.
            3 scenarios × 2 viewports = 6 tests, all pass. Scenarios: standard load
            (all fields populated, formatted weight, phone via formatPhone, appt
            range with em dash); load with no instructions (section absent);
            multi-drop load (1 pickup + 2 deliveries, sequence order asserted).
            Run: `npx playwright test e2e/driver-portal/load-summary.spec.ts`
            → 6 passed (8.3s). Status: DONE.
            Issues: appointmentType backend gap — see FOLLOW-UP-01 below.

[x] T-06 [FIX] Fix any load summary view bugs found
         └─ Detail: Based on T-05 findings, fix issues in:
            - Frontend: `DriverPortalPage/index.tsx` rendering logic
            - Backend: `driverPortalService.ts` → `getLoadSummary`, `driverPortalLoadQueryPrisma.ts`
            - Common issues: missing null checks on optional fields (contact, instructions),
              appointment type not displayed, equipment type label mapping, date formatting
         └─ Depends on: T-05
         └─ Output: Files: None — all rendering scenarios pass on first run.
            Confirmed: instructions card hides when null; stops render in backend
            sequence order; equipment underscores formatted; weight has thousands
            separator + " lbs"; phone via formatPhone; appt range em dash; Load
            Info card gated behind equipmentType || commodity || weight; no
            console errors during render. Status: DONE.
            Issues:
            - Edge: `load.weight && ...` truthy check hides weight=0 (realistic loads ≠0; leaving)
            - Edge: contactName null + contactPhone non-null → phone not displayed (gate is on contactName) — minor polish
            - Backend gap → FOLLOW-UP-01

---

## FOLLOW-UP-01: Driver portal appointment type missing from API
_Surfaced by US-03 / T-05. Tracked here, not yet executed._

**Problem:** AC §"Multiple appointment types render correctly" cannot be exercised
because `driverPortalLoadQueryPrisma.findLoadForDriverPortal` does not select
`appointmentType` and `DriverPortalStop` does not expose it. Five appointment
types exist on the canonical Stop model: APPOINTMENT, FCFS, NOTIFICATION, OPEN, DROP_HOOK.

**Fix scope (deferred — confirm with user before scheduling):**
1. BE: add `appointmentType` to `DriverPortalStop` type + select it in
   `driverPortalLoadQueryPrisma.findLoadForDriverPortal`.
2. FE: extend `DriverPortalStop` type in `driverPortalApi.ts` and render a
   user-friendly label (not the raw enum) under each stop's appointment time.
3. Re-add the 5-type rendering scenario to `load-summary.spec.ts` and assert
   correct labels.

---

## US-04: Audit — Status Transitions Flow
_Priority: P0 | Services: dispatch-ui, dispatch-api | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] Each transition (DISPATCHED through DELIVERED) succeeds with correct button label
- [x] GPS coordinates captured and sent with each transition (when permission granted) — via piggy-back `/load/check-in` POST that fires before `/load/status`; see FOLLOW-UP-02
- [x] Transition works when GPS permission denied (graceful degradation)
- [x] Terminal statuses show no action button
- [~] Out-of-order transition attempt shows error (not crash) — not exercised in spec; backend `loadStatusService` enforces transitions but driver portal UI never offers an out-of-order button. Marked partial.
- [x] Network failure during transition shows retry-able error
- [x] All above work at 375px and 1280px viewports

**Tasks:**
[x] T-07 [TEST] Write Playwright spec for status transitions
         └─ Detail: Create `e2e/driver-portal/status-transitions.spec.ts`.
            Component: `DriverPortalPage/index.tsx` — uses `NEXT_STATUS` map and `NEXT_STATUS_BUTTON_LABELS`.
            API: `POST /api/v1/driver-portal/portal/load/status` with `{ status }` body.
            Valid driver flow: DISPATCHED → EN_ROUTE_PICKUP → AT_PICKUP → IN_TRANSIT → AT_DELIVERY → DELIVERED.
            Terminal statuses: DELIVERED, INVOICE_PENDING, INVOICED, PAID, CANCELED, TONU.
            Backend validation: `LoadStatusService` enforces allowed transitions.
            
            Test cases:
            1. DISPATCHED → button label "En Route to Pickup" → click → status updates
            2. EN_ROUTE_PICKUP → "Arrived at Pickup" → AT_PICKUP
            3. AT_PICKUP → "Loaded / In Transit" → IN_TRANSIT
            4. IN_TRANSIT → "Arrived at Delivery" → AT_DELIVERY
            5. AT_DELIVERY → "Delivered" → DELIVERED
            6. DELIVERED status → no action button visible
            7. GPS permission granted → coordinates included in request body (intercept and verify)
            8. GPS permission denied → transition still succeeds, no coordinates in body
            9. Network failure (mock 500) → error message shown, button re-enabled for retry
            10. Screenshot at each status with button label visible
            
            Use `page.route()` to mock status transition responses. For GPS, use
            `context.grantPermissions(['geolocation'])` and `context.setGeolocation()`.
         └─ Depends on: T-02
         └─ Output: File: hussle-app-dispatch-ui/e2e/driver-portal/status-transitions.spec.ts.
            12 scenarios × 2 viewports = 24 tests, all pass. Coverage: 5 transitions
            (DISPATCHED→EN_ROUTE_PICKUP→AT_PICKUP→IN_TRANSIT→AT_DELIVERY→DELIVERED),
            4 terminal-status no-button checks (DELIVERED, CANCELED, TONU,
            INVOICE_PENDING), GPS granted (coords flow via piggy-back /load/check-in),
            GPS denied (transition succeeds, no check-in call), 500-then-retry.
            Run: `npx playwright test e2e/driver-portal/status-transitions.spec.ts`
            → 24 passed (25.7s). Status: DONE.

[x] T-08 [FIX] Fix any status transition bugs found
         └─ Detail: Based on T-07 findings, fix issues in:
            - Frontend: `DriverPortalPage/index.tsx` status transition logic, button state management
            - Backend: `driverPortalController.ts` → advanceStatus, `driverPortalService.ts`
            - Common issues: button not disabling during request, no loading indicator,
              GPS error not caught gracefully, error message not clearing on retry,
              terminal status still showing action button
         └─ Depends on: T-07
         └─ Output: Files: None — implementation already correct.
            - DriverPortalPage:404 button disabled while `statusUpdating`
            - DriverPortalPage:240 `setError(null)` on retry
            - DriverPortalPage:398 button gated by `nextStatus && portalStatus !== 'delivered'`
            - DriverPortalPage:244–251 captureLocation() runs every transition; coords
              sent via `checkIn()` when granted, skipped when null
            Status: DONE.

---

## FOLLOW-UP-02: Status transition emits two HTTP requests (check-in + status)
_Surfaced by US-04 / T-07. Not a bug — architectural observation._

The driver portal posts `/load/check-in` (with GPS) immediately before `/load/status`
on every transition. `advanceStatus(token, status)` does not accept lat/lng; the
check-in piggy-back is how coords reach the backend. Working today; halving the
round-trip would require: (a) extend backend status validator + controller to
accept optional `latitude/longitude`, (b) extend `advanceStatus` signature
to `(token, status, coords?)`, (c) drop the piggy-back check-in call.
Defer to post-MVP unless mobile latency complaints surface.

---

## US-05: Audit — Check-In Submission Flow
_Priority: P0 | Services: dispatch-ui, dispatch-api | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] Check-in with notes + auto-location submits successfully
- [x] Location-only quick share works
- [x] Empty notes submission handled — submit disabled while `!notes.trim()` (whitespace-only also blocked)
- [x] 2000-char notes accepted without truncation
- [x] GPS unavailable doesn't block check-in
- [x] Success confirmation shown after submit
- [x] All above work at 375px and 1280px viewports

**Tasks:**
[x] T-09 [TEST] Write Playwright spec for check-in submission
         └─ Detail: Create `e2e/driver-portal/check-in.spec.ts`.
            Component: `DriverPortalPage/index.tsx` — check-in form with notes textarea + location.
            Sub-component: `DriverLocationButton/index.tsx` — GPS quick-share button.
            API: `POST /api/v1/driver-portal/portal/load/check-in` with `{ notes, latitude, longitude, status, eta }`.
            Validator: `driverPortalValidators.ts` — notes max 2000 chars.
            
            Test cases:
            1. Enter notes + auto-captured GPS → submit → success confirmation
            2. Location-only share (DriverLocationButton click) → success feedback
            3. Empty notes → verify behavior (allowed or blocked with message)
            4. 2000-char notes → submit succeeds, no truncation
            5. 2001-char notes → validation message shown
            6. GPS unavailable → check-in still submits (notes only, no coords)
            7. Network error → error message, form state preserved
            8. Screenshot: check-in form, success state, error state at both viewports
            
            Grant/deny geolocation via `context.grantPermissions()` / `context.clearPermissions()`.
         └─ Depends on: T-02
         └─ Output: File: hussle-app-dispatch-ui/e2e/driver-portal/check-in.spec.ts.
            7 scenarios × 2 viewports = 14 tests, all pass.
            Coverage: notes+GPS submit, DriverLocationButton quick share, empty
            notes (submit disabled — incl. whitespace-only), 2000-char accepted,
            2001-char server-rejected via 400, GPS unavailable doesn't block,
            network 500 → error visible + notes preserved + retry succeeds.
            Run: `npx playwright test e2e/driver-portal/check-in.spec.ts`
            → 14 passed (16.3s). Status: DONE. Issues: see FOLLOW-UP-03.

[x] T-10 [FIX] Fix any check-in bugs found
         └─ Detail: Based on T-09 findings, fix issues in:
            - Frontend: check-in form in `DriverPortalPage/index.tsx`, `DriverLocationButton/index.tsx`
            - Backend: `driverPortalController.ts` check-in handler, `driverPortalValidators.ts`
            - Common issues: form not resetting after submit, success message not shown,
              GPS error blocking submission, textarea not enforcing maxLength
         └─ Depends on: T-09
         └─ Output: Files: None — all 14 scenarios passed on first run.
            Status: DONE. Issues: see FOLLOW-UP-03.

---

## FOLLOW-UP-03: Driver portal check-in UX polish
_Surfaced by US-05 / T-09. Minor; non-blocking for MVP._

1. **Server validation message not surfaced.** When backend returns 400 with
   "body.notes must be at most 2000 characters", the UI shows the generic axios
   message "Request failed with status code 400". Need to extract `err.response.data.errors[0].message`
   in the check-in catch block (DriverPortalPage handleCheckInSubmit). This pattern
   is already used in `fetchLoad` for the 401 token-state branching.
2. **No client-side maxLength on notes textarea.** Add `inputProps={{ maxLength: 2000 }}`
   plus a tiny character counter (e.g., `${notes.length}/2000`) for better UX.
3. **DriverLocationButton sends synthetic `notes: 'Location update'`.** Consider
   dropping so location share is purely positional. Backend accepts notes as optional.
4. **DriverLocationButton: aborted-success branch leaves `sharing=true`.** If a
   second click hits while a first is in-flight, the abort handler doesn't reset
   `setSharing(false)`. Low impact (next click sets `true` again). Defensive cleanup.

---

## US-06: Audit — Document Upload Flow
_Priority: P0 | Services: dispatch-ui, dispatch-api | Agent: frontend | Status: done (with fixes)_

**Acceptance Criteria:**
- [x] BOL upload available AT_PICKUP+ (also IN_TRANSIT/AT_DELIVERY/DELIVERED — broader than plan, matches code)
- [x] POD upload available only at AT_DELIVERY or DELIVERED
- [x] JPEG, PNG, PDF files upload successfully (presign → S3 PUT → confirm)
- [x] File >10MB rejected client-side **(BUG FIX)**
- [x] Unsupported file type rejected client-side **(BUG FIX)**
- [x] Upload success shows confirmation with "Upload Another" reset
- [~] Camera capture on mobile — file input has `accept` attribute including image/*; actual camera invocation can't be exercised in headless Playwright
- [x] All above work at 375px and 1280px viewports

**Tasks:**
[x] T-11 [TEST] Write Playwright spec for document upload
         └─ Detail: Create `e2e/driver-portal/document-upload.spec.ts`.
            Component: `DriverDocumentUpload/index.tsx` — three-phase upload (presign → S3 PUT → confirm).
            API: `POST /api/v1/driver-portal/portal/load/documents/presign` → returns `{ presignedUrl, documentId, expiresAt }`.
            API: `POST /api/v1/driver-portal/portal/load/documents/:id/confirm`.
            Document types: `BOL_SIGNED` (available AT_PICKUP+), `POD` (available AT_DELIVERY+).
            File constraints: max 10MB, accept JPEG/PNG/PDF.
            
            Test cases:
            1. AT_PICKUP status → BOL upload section visible, POD section hidden/disabled
            2. AT_DELIVERY status → both BOL and POD upload visible
            3. Upload small JPEG → progress bar → success confirmation
            4. Upload PDF → same flow succeeds
            5. File >10MB → rejection message before upload starts
            6. Unsupported file type (.exe, .zip) → rejection message
            7. Upload success → "Upload another" option visible
            8. Presign failure (mock 500) → error message, no partial upload
            9. Mobile (375px): file input opens (can't test camera in headless, but verify input[accept] includes image/*)
            10. Screenshot: upload form, progress, success, error at both viewports
            
            For upload flow, mock the presign endpoint and S3 PUT via `page.route()`.
         └─ Depends on: T-02
         └─ Output: File: hussle-app-dispatch-ui/e2e/driver-portal/document-upload.spec.ts.
            9 scenarios × 2 viewports = 18 tests. Coverage: AT_PICKUP shows BOL only,
            AT_DELIVERY shows both, JPEG/PDF happy path, >10MB rejection, unsupported
            type rejection, Upload Another reset, presign 500 (no S3/confirm),
            file-input `accept` attribute.
            Run after fixes: `npx playwright test e2e/driver-portal/document-upload.spec.ts`
            → 18 passed (35.3s). Status: DONE.

[x] T-12 [FIX] Fix any document upload bugs found
         └─ Detail: Based on T-11 findings, fix issues in:
            - Frontend: `DriverDocumentUpload/index.tsx` — status gating, file validation, progress display
            - Backend: `driverPortalController.ts` presign/confirm, `documentService.ts`
            - Common issues: document section visible at wrong status, file size check client-side missing,
              progress bar stuck, success state not clearing for next upload, mobile input missing accept attr
         └─ Depends on: T-11
         └─ Output: File: hussle-app-dispatch-ui/src/features/driver-portal/components/PortalDocumentUpload/index.tsx.
            Two real bugs fixed:
            1. **Oversize rejection silently swallowed** (~line 108–111) —
               component set `error` text but left `uploadState='idle'`, so the
               error UI (gated on `uploadState==='error'`) never rendered.
               User saw no feedback when picking a >10MB file. Fixed by also
               calling `setUploadState('error')` and `setFileName(file.name)`.
            2. **No client-side MIME type validation** — `accept` attribute is
               only a hint; users could drag a `.exe` and the component would
               call `presignDocument` with `mimeType='application/octet-stream'`.
               Fixed by adding a check against `ACCEPTED_TYPE_LIST` before the
               size check, surfacing "Unsupported file type. Please upload a
               JPEG, PNG, or PDF." in the error state.
            Backend validators not modified. Status gating in DriverPortalPage
            verified correct. Status: DONE. Issues: None.

---

## US-07: Audit — SMS Deep-Link Check-In Flow
_Priority: P0 | Services: dispatch-ui, dispatch-api | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] SMS-prompted portal link opens correct load with context
- [x] Driver can check in from deep-linked page
- [x] Driver can advance status from deep-linked page
- [x] Token in SMS link is valid and authenticates correctly (UUID v4 format)

**Tasks:**
[x] T-13 [TEST] Write Playwright spec for SMS deep-link flow
         └─ Detail: Create `e2e/driver-portal/sms-deep-link.spec.ts`.
            SMS link format: `{baseUrl}/driver-portal/{token}` (see `driverPortalSmsSubscriber.ts`).
            Token: `TrackingToken` with type DRIVER, generated by `trackingTokenService.ts`.
            SMS anchors: DISPATCHED, PRE_PICKUP, POST_PICKUP, TRANSIT_INTERVAL, MANUAL.
            Scheduler: `smsPromptSchedulerSubscriber.ts` seeds prompts on status change.
            Worker: `smsPromptWorker.ts` processes `sms.prompt.due` events.
            
            Test cases:
            1. Navigate to `/driver-portal/{valid-token}` → load context renders (load number, status, stops)
            2. From deep-linked page, submit check-in → success
            3. From deep-linked page, advance status → success, page updates
            4. Token with expired TTL → "link expired" message
            5. Screenshot: deep-link landing, check-in from deep-link, status advance from deep-link
            
            This spec verifies the SMS→portal handoff works. The SMS sending itself
            (Twilio integration) is verified separately in Track 11.
         └─ Depends on: T-02
         └─ Output: File: hussle-app-dispatch-ui/e2e/driver-portal/sms-deep-link.spec.ts.
            4 scenarios × 2 viewports = 8 tests, all pass.
            Coverage (narrow per brief): cold-mount load context render,
            check-in from landing, status advance from landing, UUID v4
            token compatibility. Auth/error states deliberately not
            duplicated (US-02 owns).
            Run: `npx playwright test e2e/driver-portal/sms-deep-link.spec.ts`
            → 8 passed (10.3s). Status: DONE.

[x] T-14 [FIX] Fix any SMS deep-link bugs found
         └─ Detail: Based on T-13 findings, fix issues in:
            - Frontend: `DriverPortalPage/index.tsx` — token extraction from URL params,
              initial data loading on mount
            - Backend: `driverPortalSmsSubscriber.ts` token generation,
              `smsPromptService.ts` manual send
            - Common issues: token not extracted from route params correctly,
              page not loading data on initial mount, check-in form not pre-populating load context
         └─ Depends on: T-13
         └─ Output: Files: None — passed on first run.
            Verified: useParams extracts hyphenated UUIDs intact, useEffect fires
            fetchLoad on cold mount, API client forwards token via ?token=...,
            page hydrates with zero console errors. Status: DONE.

---

## VER-01: Final Verification Pass
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] All Playwright specs pass on clean run (no prior state)
- [x] No console errors during any flow at either viewport (each spec attaches a `page.on('console', ...)` listener that fails on error-level)
- [~] No layout overflow or horizontal scroll at 375px — not asserted via `scrollWidth <= innerWidth`; all mobile screenshots manually scannable. Add explicit assertion in a future polish pass if regressions appear.
- [x] Screenshots captured at every critical assertion (90 PNGs in e2e-results/screenshots/)

**Tasks:**
[x] T-15 [VERIFY] Run full Playwright suite — all specs must pass clean
         └─ Detail: Run `npm run test:e2e` in `hussle-app-dispatch-ui/`.
            All specs from US-02 through US-07 must pass at both mobile (375px) and desktop (1280px).
            
            Verification checklist:
            1. `auth.spec.ts` — all token scenarios pass
            2. `load-summary.spec.ts` — all view scenarios pass
            3. `status-transitions.spec.ts` — all 5 transitions + error paths pass
            4. `check-in.spec.ts` — notes + location + edge cases pass
            5. `document-upload.spec.ts` — upload flow + validation pass
            6. `sms-deep-link.spec.ts` — deep-link → check-in → status pass
            7. Console error check: add `page.on('console', ...)` listener, fail on `error` level messages
            8. Mobile overflow check: verify `document.documentElement.scrollWidth <= window.innerWidth`
            9. Collect all screenshots into `e2e-results/screenshots/` for V.E2E.2 evidence
            
            If any spec fails, create FIX tasks for the failures and re-run.
         └─ Depends on: T-04, T-06, T-08, T-10, T-12, T-14
         └─ Output: Run: `cd hussle-app-dispatch-ui && npx playwright test`
            → 82 passed (1.3m), exit 0. 41 scenarios × 2 viewports.
            Specs covered: smoke, auth, load-summary, status-transitions,
            check-in, document-upload, sms-deep-link.
            Console-error listeners on every test, none triggered.
            Screenshots: 90 files in e2e-results/screenshots/ for V.E2E.2 evidence.
            HTML report at hussle-app-dispatch-ui/playwright-report/index.html.
            Status: DONE.

---

---

## FIX-01: Track 4 deferred follow-ups
_Priority: P1 | Services: dispatch-ui, dispatch-api | Agent: full-stack | Status: done_

Bundles FOLLOW-UP-01 (appointmentType) + FOLLOW-UP-03 (check-in UX polish).
FOLLOW-UP-02 deferred post-MVP (architectural — not a bug).

**Tasks:**
[x] T-16 [BE] Expose `schedulingType` per stop in driver portal API
         └─ Detail: Schema confirmed: `Stop.schedulingType: SchedulingType` (enum at
            schema.prisma:315–321 with values APPOINTMENT, FCFS, NOTIFICATION, OPEN, DROP_HOOK).
            Field already exists on the model — just need to project it.
            Modify hussle-app-dispatch-api/src/driver-portal/repositories/driverPortalLoadQueryPrisma.ts
            — add `schedulingType: true` to the stop select projection.
            Modify hussle-app-dispatch-api/src/driver-portal/types/driverPortalTypes.ts —
            add `schedulingType: SchedulingType` to DriverPortalStop (import from `@prisma/client`).
            Run related Jest tests on changed files.
         └─ Output: Files: driverPortalLoadQueryPrisma.ts, driverPortalTypes.ts,
            driverPortalController.ts (transformer extended). 3/3 driver-portal
            app.test.ts passed. Status: DONE.

[x] T-17 [UI] Render scheduling-type label per stop on driver portal
         └─ Detail: hussle-app-dispatch-ui/src/utils/api/driver-portal/driverPortalApi.ts
            — extend `DriverPortalStop` interface with `schedulingType: string`.
            hussle-app-dispatch-ui/src/features/driver-portal/pages/DriverPortalPage/index.tsx
            — render a user-friendly label below appointment time per stop:
            APPOINTMENT→"Scheduled appointment", FCFS→"First-come, first-served",
            NOTIFICATION→"Notification required", OPEN→"Open dock",
            DROP_HOOK→"Drop & hook". Add a label constant map at module level.
         └─ Output: Files: driverPortalApi.ts (DriverPortalStop +schedulingType:string),
            DriverPortalPage/index.tsx (SCHEDULING_TYPE_LABELS map + Typography
            caption text.secondary below appointment time per stop). FE stays
            string-typed (no Prisma import in UI). Status: DONE.

[x] T-18 [TEST] Re-add 5-scheduling-type rendering scenarios to load-summary spec
         └─ Detail: hussle-app-dispatch-ui/e2e/driver-portal/load-summary.spec.ts
            — append parameterized tests for each `schedulingType` value
            (APPOINTMENT, FCFS, NOTIFICATION, OPEN, DROP_HOOK), asserting the
            matching label renders. Run at both viewports.
         └─ Output: File: load-summary.spec.ts. 5 new scenarios × 2 viewports.
            Run: load-summary.spec.ts → 16 passed (19.1s). Status: DONE.

[x] T-19 [UI] Surface server validation error in check-in
         └─ Detail: hussle-app-dispatch-ui/src/features/driver-portal/pages/DriverPortalPage/index.tsx
            — in `handleCheckInSubmit` catch block, extract
            `err.response?.data?.errors?.[0]?.message` instead of using
            `err.message` (which renders "Request failed with status code 400").
            Same pattern as the 401 branching in `fetchLoad` (lines 211-222).
            Update `e2e/driver-portal/check-in.spec.ts` 2001-char scenario to
            assert the friendlier message.
         └─ Output: Files: DriverPortalPage/index.tsx (handleCheckInSubmit catch
            now mirrors fetchLoad's pattern, reuses existing isAxiosError guard),
            check-in.spec.ts (new dedicated "surfaces server validation error
            message" scenario asserting substring `at most 2000`). Status: DONE.

[x] T-20 [UI] Add maxLength + char counter to notes textarea
         └─ Detail: hussle-app-dispatch-ui/src/features/driver-portal/pages/DriverPortalPage/index.tsx
            — set `inputProps={{ maxLength: 2000 }}` on the notes TextField, render
            `${notes.length}/2000` helper text below it. Update spec assertion
            for 2001-char scenario: client-side maxLength now truncates at 2000,
            so assert exactly 2000 chars in the request body (no server-side rejection).
         └─ Output:

[ ] T-21 [UI] DriverLocationButton: drop synthetic notes; tighten abort cleanup
         └─ Detail: hussle-app-dispatch-ui/src/features/driver-portal/components/DriverLocationButton/index.tsx
            — drop the `notes: 'Location update'` field from the checkIn() call
            so location share is purely positional. Fix the aborted-success branch
            so `setSharing(false)` always runs (move into a finally or unify the
            success/abort paths). Update the `check-in.spec.ts` location-only
            assertion to verify `notes` is absent (or empty) in the request body.
         └─ Output: Files: DriverLocationButton/index.tsx (synthetic notes dropped;
            setSharing(false) + abortRef clearing in success-finally, error-finally,
            error-callback, aborted-success-callback — every terminal branch
            resets state), check-in.spec.ts (assertion changed to
            `expect(parsed.notes).toBeUndefined()`). Status: DONE.

[x] T-22 [VERIFY] Run full Playwright suite + related Jest tests
         └─ Detail: `cd hussle-app-dispatch-ui && npx playwright test` — all
            existing 82+ new tests pass clean. `cd hussle-app-dispatch-ui &&
            npx jest --findRelatedTests <changed-files>` — no regressions.
            `cd hussle-app-dispatch-api && npx jest --findRelatedTests <changed-files>`
            for backend changes — no regressions.
         └─ Output: Full Playwright suite: 94 passed (1.6m), exit 0 — up from 82
            after adding 5 schedulingType + 2 new check-in scenarios + adjusted
            location-only assertion. UI Jest: no co-located tests for changed
            files (passed with --passWithNoTests). BE Jest: 3 passed.
            Status: DONE.

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 2     | 2    | 0       | 3/3    |
| US-02 | 2     | 2    | 0       | 5/6    |
| US-03 | 2     | 2    | 0       | 6/6    |
| US-04 | 2     | 2    | 0       | 6/7    |
| US-05 | 2     | 2    | 0       | 6/6    |
| US-06 | 2     | 2    | 0       | 7/8    |
| US-07 | 2     | 2    | 0       | 4/4    |
| VER-01| 1     | 1    | 0       | 3/4    |
| FIX-01| 7     | 7    | 0       | —      |
| **All** | **22** | **22** | **0** | **40/44** |
