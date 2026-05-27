# FleetCommand Production-Readiness Audit

**Date:** 2026-04-20
**Scope:** Full codebase audit across all 16 feature areas
**Purpose:** Establish ground truth of what's built, what business rules exist, and what's needed for production. Feeds into Product Overview and User Guide documents (Phase 2).

---

## Product Overview

### What FleetCommand Is

FleetCommand is an all-in-one dispatch management platform built for owner-operators and small trucking fleets (1-15 trucks). It replaces the patchwork of spreadsheets, load boards, email invoicing, and manual IFTA calculators that most small fleets use today with a single integrated system that handles dispatch operations, fleet management, invoicing, settlements, and accounting.

### Target Market

- **Primary:** Owner-operators running 1-5 trucks who currently manage everything in spreadsheets and email
- **Secondary:** Small fleet operators (5-15 trucks) with a dedicated dispatcher who need visibility across loads, drivers, and finances
- **Entry Point:** Dispatch + invoicing (the daily pain), with accounting and load intelligence as retention features

### User Roles

| Role | Access | Description |
|---|---|---|
| **Admin/Owner** | Full access | Business owner — manages financials, settlements, team, carrier relationships, org settings |
| **Dispatcher** | Operational access | Day-to-day load management — creates loads, manages board, sends invoices, coordinates drivers. Cannot see partner split. |
| **Viewer** | Read-only | Fleet activity monitoring — sees dashboard, loads, fleet status but cannot modify |
| **Driver** (Portal) | Limited self-service | Separate portal — views assigned load, updates status, uploads BOL/POD, submits expenses |
| **Carrier** (Portal) | Onboarding only | Separate portal — completes onboarding questionnaire, uploads documents, signs agreements |

### What's Built Today — Current Feature State

FleetCommand has 18 feature areas built and accessible in the UI, backed by 100+ API endpoints and a PostgreSQL database with 30+ models. The stack is React 18 + MUI v5 on the frontend, Express + Prisma on the backend, with Redis for caching and RabbitMQ for async event processing.

#### Core Dispatch Operations (Working)
- **Dispatch Board** — 5 views: Kanban (status columns), Table (sortable/filterable), Driver Group (loads by driver), Command Center (map), and Intel Feed (load sourcing). Kanban is the primary workflow view.
- **Load Lifecycle** — 14-status state machine: QUOTED > BOOKED > DISPATCHED > EN_ROUTE_PICKUP > AT_PICKUP > IN_TRANSIT > AT_DELIVERY > DELIVERED > INVOICE_PENDING > INVOICED > PAID (plus EXCEPTION, CANCELED, TONU). Each transition has defined prerequisites and side effects.
- **Load Creator** — 4-step form: Route & Stops > Cargo > Assignment & Rate > Review. Includes place typeahead, real-time margin calculation, equipment type selection, and multi-stop support.
- **Load Detail** — Tabbed view with Overview (route, assignment, contacts, rate — all editable via drawers), Financials (revenue/cost breakdown), Documents (upload + BOL workflow), and Notifications (customer notification history + overrides).
- **Financial Calculations** — Dispatch fee, partner split, carrier payout, driver pay, dispatcher commission, rate per mile, estimated cost — all calculated using Decimal.js with banker's rounding. Financials freeze after DISPATCHED status.
- **Detention Auto-Detection** — When a driver's stop wait time exceeds the org's free hours, system auto-creates a DETENTION accessorial charge and publishes a domain event.

#### Fleet Management (Working)
- **Carriers** — Full CRUD with list (filterable by type/status), detail page (7 tabs: General, Drivers, Vehicles, Load History, Documents, Notes, Onboarding), and KPI stats (load count, lifetime revenue). Supports COMPANY_ASSET and EXTERNAL_CARRIER types. Insurance expiry tracking with 7/30-day warning badges.
- **Drivers** — Full CRUD with list, detail page (5 tabs: Overview, Schedule, Preferences, Load History, Documents). Weekly availability schedule with day-of-week entries. Schedule overrides for time-off. Preferred lanes, no-go zones, home base tracking. Deadhead-to calculation using haversine distance.
- **Vehicles** — Full CRUD with list, detail page (4 tabs: Overview, Expenses, Load History, Documents). Equipment types: DRY_VAN, REEFER, FLATBED, STEP_DECK, BOX_TRUCK, HOTSHOT, POWER_ONLY. Expense management with CPM calculation. Monthly gross/miles targets. One-to-one driver assignment with active load blocking.

#### Customer & Relationship Management (Working)
- **Customers** — Full CRUD. Types: BROKER, DIRECT_SHIPPER, THREE_PL. Payment terms (Net 30/60/etc), quick pay discount. Stats: total revenue, avg days to pay, outstanding AR, load count.
- **Contacts** — Full CRUD. Link to customers, carriers, places. Freeform role field. Stats: load count, recent loads.
- **Places** — Full CRUD with geocoding via AWS Location Services. Typeahead search for stop entry. Route distance calculation. Facility details: dock type, operating hours, lumper/PPE requirements, check-in procedures.

#### Invoicing (Working with Gaps)
- **Auto-Generation** — Invoices created from delivered loads with customer rate, accessorials, and payment terms pulled automatically. Idempotency prevents duplicates.
- **Status Workflow** — DRAFT > APPROVED > SENT > PAID (with PARTIALLY_PAID and VOID paths).
- **PDF Generation** — Puppeteer renders React template with carrier info, route, stops, line items, factoring details.
- **Email Delivery** — Invoice PDF + load documents (BOL, POD, rate con) attached. Sent via SES/SMTP.
- **Invoice Packet** — ZIP download of invoice PDF + all associated load documents.
- **Payment Tracking** — Mark as paid with amount, method (ACH/CHECK/WIRE/CREDIT_CARD), reference, date. Supports partial payments.
- **Gap:** Invoice builder page is "Coming Soon" — no manual line item editing. No OVERDUE auto-transition.

#### Accounting (Working with Gaps)
- **Settlements** — Generate from delivered loads for a carrier/period. Line items: LOAD_REVENUE, DISPATCH_FEE, ACCESSORIAL, EXPENSE, ADJUSTMENT. Workflow: DRAFT > APPROVED > PAID (with DISPUTED path). PDF generation via Puppeteer. Email delivery with PDF attachment. Manual adjustments supported in DRAFT.
- **Expenses** — Full CRUD. Categories: FUEL, MAINTENANCE, TOLLS, PARKING, INSURANCE, TRUCK_PAYMENT, and 14 more. Fuel-specific: 2-of-3 rule (amount/gallons/price — system calculates the third). Recurring expenses with WEEKLY/MONTHLY generation. Receipt upload via S3 presign.
- **IFTA Reporting** — Quarter-based report: miles by state + fuel by state per vehicle. Auto-calculated from load state miles and fuel expenses. Fleet-level aggregation with MPG.
- **Gap:** Expenses use native JS numbers (not Decimal.js). LoadRateDrawer submit disabled. Settlement PDF download button missing from UI.

#### Carrier Onboarding Portal (Partially Working)
- **6-Phase Questionnaire** — Company info > Equipment > Drivers > Cost Analysis > Lane Preferences > Documents. Conversational TurboTax-style UX with auto-save.
- **Invite Flow** — Dispatcher sends invite email with 7-day token. Carrier accesses portal via token link.
- **Approval Gate** — EXTERNAL_CARRIER requires: dispatch agreement signed, insurance cert on file (not expired), W9 received. COMPANY_ASSET passes unconditionally.
- **Approval/Rejection** — Dispatcher reviews completed onboarding and approves or rejects with reason.
- **Gap:** Documents phase (Phase 6) has partial implementation — no validation that required docs are actually uploaded before completing.

#### Driver Self-Service Portal (Working)
- **Load View** — Driver sees assigned load summary, stops, commodity, instructions.
- **Status Progression** — Driver clicks through: Arrived at Pickup > Loaded > In Transit > At Delivery > Delivered. GPS auto-captured on each transition.
- **Check-Ins** — Manual location/ETA/notes submission decoupled from status changes.
- **Document Upload** — BOL_SIGNED and POD upload with progress tracking.
- **Expense Submission** — Drivers can submit expenses via vehicle token auth.

#### Load Tracking (Working, Manual Only)
- **Check Calls** — Dispatcher creates check call records with location, ETA, status, notes, broker notification flag.
- **Public Tracking** — 7-day tracking tokens expose: load number, status, origin/destination, ETA, last check-in location. Rate-limited, no auth required.
- **Gap:** Manual only. No real-time tracking, no geofencing, no WebSocket updates.

#### Customer Notifications (Working with Gaps)
- **Events:** Load status changes (email + SMS), check calls logged (email + SMS), team invitations (email only).
- **Preferences:** Dual-level — customer-wide defaults + per-load overrides. Dispatchers configure in UI.
- **Channels:** Email (SES/SMTP) + SMS (Twilio). Both default to console logging in dev.
- **History:** Full notification log with sent/failed status, viewable per load.
- **Gap:** DOCUMENT_UPLOADED event defined but never fires. Carrier onboarding completion email not sent.

#### Dashboard (Working with Gaps)
- **KPIs:** Active loads by status (kanban counts), weekly revenue, monthly revenue, dispatch fees, overdue invoices.
- **Attention Items:** 6 categories — Exceptions, Overdue Invoices, Missing Rate Con, Missing BOL, Expiring Insurance, Unconfirmed Pickups. Color-coded severity (red/orange). Clickable links to relevant records.
- **Pending Carriers:** Widget showing carriers awaiting onboarding approval.
- **Gap:** Weekly gross tracker endpoint missing from backend (always shows empty).

#### Load Intelligence (Functional, Not Production-Ready)
- **Scoring Engine** — Composite score (0-100): CPM profitability + destination market strength (load-to-truck ratio tiers: Hot/Balanced/Soft/Dead) + driver fit (preferred lanes, no-go zones, home base proximity, days out).
- **Chain Building** — Round-trip optimization: outbound load + backhaul search (50mi radius). 2-step or 3-step chains based on distance from home. Cached 24h in Redis.
- **Feed UI** — Card grid with filters (score tier, equipment, market, rate, source). Available on dispatch board (Intel view) and standalone page.
- **Manual Entry** — Dispatchers can add loads manually with origin/dest, pickup date, equipment, rate, miles.
- **Book Action** — Pre-fills create load form with intel data (doesn't actually create the load until dispatcher submits).
- **Gap:** Market data requires external manual push. Chain performance concerns with sequential backhaul searches. DAT integration not working (push handler unimplemented).

#### Auth & Settings (Working with Security Gaps)
- **Auth:** AWS Cognito + JWT (1h access) + Redis sessions (24h refresh). Login, signup, email confirmation, forgot/reset password, forced password change.
- **Multi-Tenant:** Users can belong to multiple orgs. Org switching creates new session/tokens.
- **Team Management:** Invite members, change roles, remove members. Seat limits per subscription tier.
- **Org Settings:** Financial defaults (TONU fee, detention rate, profit margin, weekly gross target), operations settings (max days out, backhaul radius, chain depth), prohibited commodities, communication settings.
- **Gap:** No CSRF protection. Invite acceptance doesn't fully create user/membership. No data scoping enforcement at middleware level. JWT claims not rotated on role change.

#### Chrome Extension — DAT/Relay Scraper (Not Production-Ready)
- **DAT Scraping** — Intercepts XHR responses from `freight.api.prod.dat.com` search API. Extracts match details, deduplicates by compound key (company + equipment + origin + destination + weight + length).
- **Relay Scraping** — Intercepts fetch responses from `relay.amazon.com` load board API. Extracts work opportunities with payout, distance, equipment, commodity.
- **API Ingestion** — Loads sent to FleetCommand API, normalized to canonical StagedLoad schema, stored in Redis with TTL based on pickup time. Snapshot-replace pattern (atomic per org+source).
- **Gap:** DAT push handler unimplemented (loads captured but never sent). Auth disabled on ingest endpoint. AWS credentials exposed in source. No deduplication at API level. No tests.

### Intended Roadmap

These features are planned but not yet built. Sourced from the `.planning/` directory (18 feature plans).

#### Near-Term (Pre-Production Fixes)
- **Critical Security Fixes** — Rotate exposed credentials, add CSRF protection, enable auth on ingest endpoint, fix data scoping
- **Core Workflow Completion** — Wire auto-invoice on DELIVERED, enable LoadRateDrawer submit, implement weekly gross endpoint, complete invite acceptance flow
- **Data Integrity** — Add Decimal.js to expenses/IFTA, add financial freeze check in recalc subscriber, add optimistic locking on load transitions

#### Short-Term (Post-Launch Enhancements)
- **Financial Model Redesign** — 10-phase migration adding: driver pay types (PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE) with UI configuration, vehicle CPM wired into load financials, dispatcher commission tracking, new accounting section with settlements/IFTA/expenses pages, field renames for clarity (carrierRate > carrierPayout, dispatchFee > companyMargin)
- **Invoice Builder** — Full manual invoice creation and line item editing UI
- **OVERDUE Auto-Transition** — Background job to transition past-due invoices
- **Document Expiry Enforcement** — Background job for insurance/W9 expiry, blocking dispatch for expired carriers
- **Real-Time Notifications** — Wire DOCUMENT_UPLOADED event, complete carrier onboarding email, enable SMS in production

#### Medium-Term (Growth Features)
- **Load Intelligence Production** — DAT extension fully functional, automatic market data refresh, performance-optimized chain building, server-side feed filtering
- **Carrier Onboarding Completion** — Documents phase validation, FMCSA verification, post-activation workflows
- **Enhanced IFTA** — AWS Location Services for accurate road distances, state boundary intersection for per-state mileage, manual override capability
- **Trip Miles vs Total Miles** — Distinction between loaded miles and deadhead, dual RPM display, auto-calculate deadhead from driver location
- **UI Standardization** — Shared FilterBar, ListKpiBar, DocumentsTab components. Migrate all drawers/modals to Redux state. Consistent page structure across all features.

#### Long-Term (Platform Vision)
- **QuickBooks Integration** — Bidirectional sync for invoices, expenses, and settlements
- **WebSocket Real-Time Updates** — Live dispatch board, real-time load tracking, instant notification delivery
- **Load Board Production** — Multi-source load aggregation, preference filtering, one-click booking, lane rate analytics
- **Customer Portal** — Shipper/broker self-service for load tracking, document access, payment
- **Advanced Analytics** — Fleet P&L dashboard, carrier performance scoring (network-aggregated), broker payment scoring

---

## Planning Cross-Check (.planning/ vs Actual Codebase)

All 18 `.planning/` directories are marked "PLANNED" but the majority of features are already built. This cross-check maps each plan against what the audit found in the codebase.

| Plan | Planned Scope | % Built | What's Done | Key Gaps Remaining |
|---|---|---|---|---|
| **load-board-ingest** | Extension auth, Relay push, Redis staging, map view | **70%** | Relay push, Redis staging, API mappers, map view, feed endpoint | Auth disabled (CRIT-03), DAT push broken (CRIT-09), no API dedup, hardcoded URLs |
| **financial-analysis** | Calc financials at creation, fix partnerSplit, carrier fee% | **85%** | Calculation engine (Decimal.js), partnerSplit formula fixed, carrier fee% used | Financials trigger on BOOKED not creation, driver fee display unconfirmed |
| **load-operations** | Scheduling enforcement, dispatch gates, detention | **95%** | Scheduling types, dispatch gate with prereqs/warnings, detention auto-detect, DROP_HOOK exempt, domain events | Minor scheduling type validation gaps |
| **financial-model-calculations** | Wire vehicleCpm, dispatcher comm, accessorial recalc | **90%** | vehicleCpm from RecurringExpense, dispatcher commission lookup, recalc subscriber, derived fields | ~~Recalc ignores lock status (HIGH-01)~~ resolved — not a bug |
| **financial-model-schema** | New Load/Driver/Carrier fields, new models, LEASED_CARRIER | **90%** | All new fields on Load, Driver payType/payRate, Carrier feeType/payFromNet, DispatcherProfile, Expense, Settlement, LoadStateMiles models | Loan/LoanPayment models missing, LEASED_CARRIER not in UI |
| **carrier-onboarding** | 6-phase portal, invite flow, approval gate | **80%** | All 6 phases built, invite with 7-day tokens, session auto-save, approve/reject with events | Documents phase has no required-doc validation (HIGH-09) |
| **financial-model-expenses** | Expense CRUD, fuel 2-of-3, receipts, recurring, driver portal | **85%** | Full CRUD, fuel validation, receipt presign/confirm, recurring expenses, driver portal access, domain events | Expenses use JS numbers not Decimal.js (HIGH-02), no receipt UI for dispatchers |
| **prod-refine** | 13 UI polish tasks (mobile, skeletons, stats, components) | **50%** | CarrierKPI stats, non-CDL licenseType, entity stats endpoints, invoice stops in PDF | Mobile fixes, skeleton loaders, component consolidation unverified |
| **trip-miles** | loadedMiles vs totalMiles, auto deadhead, dual RPM | **70%** | Schema fields, ratePerMile + ratePerTotalMile calculations, driver location fields, deadhead-to service | Auto-deadhead on driver selection, location update endpoint (HIGH-19), dual RPM UI |
| **financial-model-ifta** | AWS routing, state boundaries, IFTA report, manual override | **80%** | AWS Location routing, state mileage auto-calc, LoadStateMiles, IFTA report endpoint, Redis caching | Uses Math.round not Decimal.js (HIGH-03), manual override UI missing |
| **entity-autocomplete-refactor** | Unified EntityAutocomplete, FormDrawer migration | **60%** | Individual autocompletes exist, FormDrawer pattern used, StopFormCard built | Unified base component unconfirmed, full migration incomplete |
| **financial-model-settlements** | Generation, line items, workflow, PDF, email | **85%** | Full generation, 5 line item types, DRAFT>APPROVED>PAID workflow, Puppeteer PDF, email delivery, adjustments | Auto-draft cron not configured, PDF download button missing (HIGH-15) |
| **load-board-prod** | Preference filtering, book action, rate limiting, staleness UX | **40%** | Book action (prefill), feed pagination, scoring, chain building | Preference filtering, pagination replay, per-org rate limiting, staleness UX, lane analytics, S3 archival |
| **ui-review** | Shared FilterBar/ListKpiBar/DocumentsTab, Redux drawer migration | **40%** | Per-feature KPI bars, Redux drawer/modal dispatch, AG Grid on list pages | Shared components not unified, Typography helpers, full registry completeness |
| **codebase** | Plan file missing | **N/A** | — | — |
| **user-management** | Team tab, invites, roles, seat limits | **75%** | Team tab, invite dialog, member list, role changes, seat limits, invite acceptance UI | Invite accept doesn't create user (CRIT-04), resend/revoke missing |
| **financial-model-bugfixes** | Fix updateLoad recalc, computeMetrics, weekly gross | **50%** | Carrier-type-aware revenue in engine, recalc subscriber exists | Weekly gross endpoint missing (CRIT-08), ~~recalc lock check (HIGH-01)~~ resolved |
| **financial-model-ui** | Field renames + accounting pages | **60%** | Settlement, IFTA, expense pages built, accounting nav section, Redux + API clients | Field renames not done, partnerSplit still in UI, earnings dashboard/Fleet P&L not built |

**Overall: 12 of 18 plans are 70%+ built. The `.planning/` directory significantly understates progress.**

---

## Feature Ratings

| Feature | Rating | Verdict |
|---|---|---|
| DAT/Relay Scraper | **D+** | Not production-ready. Exposed AWS creds, DAT push unimplemented, auth disabled |
| Load Management | **B** | State machine solid, financials use Decimal.js. Auto-invoice stubbed, no optimistic locking |
| Load Tracking | **B-** | Check-in + GPS + tracking tokens work. Manual only, no real-time, no geofencing |
| Document Management | **B** | Upload flow works, BOL workflow built. No expiry enforcement, no insurance gate |
| Customer Notifications | **B-** | Clean architecture, email/SMS templated. DOCUMENT_UPLOADED never fires, SMS defaults console |
| Accounting & Finance | **B-** | Settlements use Decimal.js, PDF works. Expenses use native JS numbers, LoadRateDrawer disabled |
| Invoicing | **B-** | End-to-end flow works (create-send-pay). Builder page "Coming Soon", no OVERDUE auto-transition |
| Carrier Mgmt + Onboarding | **B-** | CRUD solid, portal 6-phase built. Documents phase incomplete, LEASED_CARRIER missing from UI |
| Auth & User Management | **C+** | Cognito+JWT+Redis solid foundation. No CSRF, invite accept incomplete, no data scoping enforcement |
| Dashboard | **B-** | KPIs + attention items work. Weekly gross endpoint MISSING from backend |
| Load Intelligence | **B-** | Scoring + chaining functional. Market data manual-push only, chain perf concerns |
| Driver Management | **C+** | CRUD + schedule + availability work. Pay config completely missing from UI, no location update endpoint |
| Vehicle Management | **B** | Good expense mgmt, CPM calc works. Finance fields orphaned, weekly revenue empty |
| Customer Management | **B** | CRUD + stats solid. No billing/factoring config, revenue not wired to list |
| Contact Management | **C+** | Basic CRUD only. Freeform roles, no type standardization, minimal validation |
| Place Management | **B** | Geocoding + typeahead + routing work. Facility hours UI missing |

---

## Critical Blockers

These must be fixed before any production deployment.

### CRIT-01: Exposed AWS Credentials in Source Code
- **Feature:** DAT/Relay Scraper
- **File:** `dat-load-scraper/src/utils/s3.ts` (lines 8-9, 93-94, 113-114)
- **Issue:** AWS Access Key ID and Secret Access Key were hardcoded in source (now removed)
- **Impact:** Anyone with repo access can access S3/SQS. If repo is public, full AWS compromise.
- **Fix:** Rotate credentials immediately. Move to environment variables or chrome.storage config.

### CRIT-02: No CSRF Protection on Auth Endpoints
- **Feature:** Auth & User Management
- **File:** `hussle-app-dispatch-api/src/auth/` (security.ts, cookie handling)
- **Issue:** Cookies set without explicit SameSite enforcement. No CSRF tokens in requests. CORS allows credentials from frontend origin.
- **Impact:** Cross-site form submissions could hijack authenticated sessions.
- **Fix:** Add `SameSite: 'Lax'` or `'Strict'` to all cookies. Consider adding CSRF token validation for state-changing requests.

### CRIT-03: Load Board Ingest Endpoint Has No Auth
- **Feature:** DAT/Relay Scraper
- **File:** `hussle-app-dispatch-api/src/load-board/routes/loadBoardRoutes.ts` (line 16-22)
- **Issue:** `TODO: re-enable appAuth once extension auth flow is finalized` — endpoint accessible without authentication. Hardcoded dev org ID used as fallback.
- **Impact:** Anyone can POST arbitrary load data to the API.
- **Fix:** Re-enable `appAuth` middleware on the ingest endpoint. Remove hardcoded org ID fallback.

### CRIT-04: Invite Acceptance Doesn't Create User or Membership
- **Feature:** Auth & User Management
- **File:** `hussle-app-dispatch-api/src/auth/services/acceptInvitationService.ts` (lines 17-62)
- **Issue:** `acceptInvitation()` only marks the invite as ACCEPTED. Does NOT create a user account or membership record. The UI sends password + user details but the backend doesn't process them.
- **Impact:** Invited team members cannot actually join the organization. Core team management flow is broken.
- **Fix:** Implement user creation (Cognito + DB) and membership creation within the accept flow, or wire to a two-step signup that references the invite token.

### CRIT-05: No Data Scoping Enforcement at Middleware Level
- **Feature:** Auth & User Management
- **File:** Across all services — no centralized enforcement
- **Issue:** `req.organizationId` is injected by auth middleware, but each service/repository must manually filter by it. No global middleware validates that queries are org-scoped. If any service forgets the filter, cross-org data leaks.
- **Impact:** Lateral data access between organizations. Multi-tenant isolation breach.
- **Fix:** Add middleware or repository-level interceptor that validates organizationId is present in all queries. Consider Prisma middleware for automatic scoping.

### CRIT-06: Auto-Invoice on DELIVERED is Stubbed (TODO)
- **Feature:** Load Management
- **File:** `hussle-app-dispatch-api/src/loads/services/loadStatusService.ts` (lines 70-73)
- **Issue:** `AUTO_GENERATE_INVOICE` side effect is tagged on DELIVERED and TONU transitions, but the handler says: "Invoice generation will be wired in a future story" — no implementation.
- **Impact:** Core workflow broken. Delivering a load doesn't auto-generate an invoice, requiring manual creation every time.
- **Fix:** Wire the side effect to call `invoiceGenerationService.generateFromDelivery()` which already exists and works. The generation service is built — it just needs to be called from the status transition handler.

### CRIT-07: LoadRateDrawer Submit Handler Commented Out
- **Feature:** Accounting & Finance
- **File:** `hussle-app-dispatch-ui/src/features/load/components/LoadRateDrawer/index.tsx` (lines 54-66)
- **Issue:** `handleSubmit()` logs values to console but the `dispatch()` call is commented out. The save button does nothing.
- **Impact:** Users cannot edit load rates (customer rate, carrier rate, fees) after initial creation. Any rate negotiation changes require direct API calls.
- **Fix:** Uncomment the dispatch call and wire to the `updateLoad` saga for rate fields.

### CRIT-08: Weekly Gross Endpoint Missing from Backend
- **Feature:** Dashboard
- **File:** Frontend calls `/loads/weekly-gross` but no matching backend route/controller/service exists in the dashboard or loads module
- **Issue:** The dashboard page dispatches `fetchWeeklyGrossRequest()` which calls an API endpoint that doesn't exist. Saga falls back to empty array (`?? []`).
- **Impact:** Dashboard weekly gross tracker always shows empty. No error displayed to user — silent failure.
- **Fix:** Implement the `/loads/weekly-gross` endpoint: query loads by week, group by vehicle, sum customerRate, join with vehicle targets.

### CRIT-09: DAT Push Handler Unimplemented in Extension
- **Feature:** DAT/Relay Scraper
- **File:** `dat-load-scraper/src/contentScript/background.ts`
- **Issue:** `case 'PUSH_DAT_LOADS'` branch exists in the message listener but only logs — doesn't send data to the API. Relay push works, DAT push does not.
- **Impact:** DAT loads are captured by the extension but never transmitted to FleetCommand. Only Relay loads reach the API.
- **Fix:** Implement the DAT push handler following the same pattern as the Relay push (lines 94-103 in background.ts).

### CRIT-10: Driver Pay Configuration Missing from UI
- **Feature:** Driver Management
- **File:** `hussle-app-dispatch-ui/src/features/driver/components/DriverFormDrawer/index.tsx`
- **Issue:** `payType` (PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE) and `payRate` fields exist in Prisma schema (schema.prisma lines 630-631) but are completely absent from the driver form UI. No form field, no validation schema, no display in detail view.
- **Impact:** Cannot configure driver compensation from the UI. Settlement calculations that depend on driver pay type will use null values, producing incorrect payouts.
- **Fix:** Add payType selector and payRate input to DriverFormDrawer. Add to driverInfoSchema validation. Display in DriverOverviewTab.

---

## High Priority Issues

These should be fixed before production but are not as immediately dangerous as critical blockers.

### ~~HIGH-01: Financial Recalc Subscriber Ignores Lock Status~~ — RESOLVED (not a bug)
- **Feature:** Accounting & Finance
- **File:** `hussle-app-dispatch-api/src/loads/services/financialRecalcSubscriber.ts`
- **Original concern:** Recalc subscriber doesn't check if load is DISPATCHED or beyond before recalculating.
- **Resolution (2026-04-20):** This is correct behavior, not a bug. Accessorial charges (detention, lumper, TONU) are intentionally added after dispatch. The recalc recomputes *derived* fields (dispatchFee, carrierPayout, companyMargin, driverPay) from the existing customerRate + updated accessorials total + carrier terms. It does NOT modify the core rate fields. The "freeze" concept applies to user-editable rate inputs (customerRate, carrierRate), which the UI already locks via `FINANCIALS_LOCKED_STATUSES`. Blocking recalc after dispatch would cause settlements to show incorrect carrier payouts when detention/accessorial charges are added. The `.planning/financial-model-calculations/tasks.md` already documents this: "Freeze rules are handled naturally — customerRate stored on the load doesn't change."

### HIGH-02: Expense Calculations Use Native JS Numbers
- **Feature:** Accounting & Finance
- **File:** `hussle-app-dispatch-api/src/expenses/services/expenseService.ts` (line 42)
- **Issue:** Fuel calculation `gallons * pricePerGallon` uses native JavaScript number multiplication. No Decimal.js.
- **Impact:** Floating-point precision errors on fuel calculations. Example: 12.5 * 3.123456 may not equal 39.043200 exactly.
- **Fix:** Wrap fuel calculations in Decimal.js, consistent with settlements and load financials.

### HIGH-03: IFTA Reporting Uses Math.round() Instead of Decimal.js
- **Feature:** Accounting & Finance
- **File:** `hussle-app-dispatch-api/src/ifta/services/iftaReportService.ts` (line 41)
- **Issue:** `roundTwo(value)` uses `Math.round(value * 100) / 100` — standard JS rounding, not banker's rounding.
- **Impact:** Rounding discrepancies between IFTA report totals and settlement calculations (which use Decimal.ROUND_HALF_EVEN).
- **Fix:** Use Decimal.js `toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN)` for all IFTA calculations.

### HIGH-04: DOCUMENT_UPLOADED Notification Event Never Fires
- **Feature:** Customer Notifications
- **File:** `hussle-app-dispatch-api/src/notifications/` — no event emitter exists anywhere in codebase
- **Issue:** `DOCUMENT_UPLOADED` is defined as a valid NotificationTrigger enum in the schema, validators, and UI. Customers can configure preferences for it. But zero code ever emits this event.
- **Impact:** Customers who enable document upload notifications will never receive them. Silent failure.
- **Fix:** Emit `load.document.uploaded` event from `documentService.confirm()` after successful upload confirmation. Add handler in `notificationSubscriber.ts`.

### HIGH-05: No Optimistic Locking on Load Status Transitions
- **Feature:** Load Management
- **File:** `hussle-app-dispatch-api/src/loads/services/loadStatusService.ts`
- **Issue:** No version field or optimistic lock on Load entity. Two concurrent PATCH /transition requests could both succeed, causing inconsistent state.
- **Impact:** Race condition — two dispatchers could transition the same load simultaneously, potentially skipping states or creating conflicting side effects.
- **Fix:** Add `version` integer column to Load. Increment on every update. Return 409 Conflict if version doesn't match.

### HIGH-06: Invoice Builder Page Shows "Coming Soon"
- **Feature:** Invoicing
- **File:** `hussle-app-dispatch-ui/src/features/invoices/pages/InvoiceBuilderPage/index.tsx` (line 14)
- **Issue:** The invoice builder route exists but renders a placeholder. Invoices can only be auto-created from delivered loads — no manual creation or editing of line items.
- **Impact:** Dispatchers can't manually adjust invoice amounts, add custom line items, or create invoices outside the auto-generation flow.
- **Fix:** Implement the builder UI with line item editing, accessorial breakdown, and manual overrides.

### HIGH-07: No OVERDUE Status Auto-Transition for Invoices
- **Feature:** Invoicing
- **File:** `hussle-app-dispatch-api/src/invoices/services/invoiceService.ts`
- **Issue:** OVERDUE is defined as a valid status but never automatically assigned. No background job checks if `dueDate < now()` on SENT invoices.
- **Impact:** Overdue invoices remain in SENT status. Dashboard attention items catch them, but the invoice itself doesn't reflect the overdue state.
- **Fix:** Add scheduled job (cron or Bull queue) that transitions SENT invoices past due date to OVERDUE.

### HIGH-08: Payment History Overwrites Instead of Appending
- **Feature:** Invoicing
- **File:** `hussle-app-dispatch-api/src/invoices/services/invoiceService.ts` (lines 154-201)
- **Issue:** `markPaid()` overwrites `paidAt`, `paymentMethod`, `paymentReference` on each payment. For partial payments, only the latest payment is recorded.
- **Impact:** No audit trail of payment history. Can't see when first partial payment was made.
- **Fix:** Create a `Payment` model linked to Invoice. Append each payment as a new record.

### HIGH-09: Carrier Onboarding Documents Phase Incomplete
- **Feature:** Carrier Management
- **File:** `hussle-app-dispatch-api/src/carrier-portal/services/onboardingSessionService.ts` (lines 91-128)
- **Issue:** Phase 6 (Documents) has partial implementation. No validation that required documents (insurance cert, dispatch agreement, W9) are actually uploaded before completing onboarding.
- **Impact:** Carriers can complete onboarding without proof documents. Onboarding gate may pass but documents not actually on file.
- **Fix:** Add document existence check in `session.complete()`. Block completion if required docs not signed/uploaded.

### HIGH-10: LEASED_CARRIER Type Missing from UI
- **Feature:** Carrier Management
- **File:** `hussle-app-dispatch-ui/src/features/carrier/validators/carrierSchema.ts` (line 11)
- **Issue:** UI type selector only has COMPANY_ASSET, EXTERNAL_CARRIER, OWNER_OPERATOR. LEASED_CARRIER exists in API/DB but can't be created from the UI.
- **Impact:** Cannot manage leased carriers through the application. Must use API directly.
- **Fix:** Add LEASED_CARRIER to the carrier type selector in the UI schema and form.

### HIGH-11: OWNER_OPERATOR Selectable in UI but Always Rejected by API
- **Feature:** Carrier Management
- **File:** `hussle-app-dispatch-api/src/carriers/services/carrierService.ts` (lines 44-46)
- **Issue:** UI allows selecting OWNER_OPERATOR type, but API throws error "Owner-operator support coming soon."
- **Impact:** Confusing UX — users create a carrier, select owner-operator, fill out form, and get rejected on submit.
- **Fix:** Either remove OWNER_OPERATOR from UI selector until supported, or add a disabled state with tooltip.

### HIGH-12: JWT Claims Not Rotated on Role Change
- **Feature:** Auth & User Management
- **File:** Auth middleware, token generation
- **Issue:** JWT contains static role claim. When an admin changes a member's role, the old token keeps the old role until it expires (1 hour).
- **Impact:** Demoted users retain elevated access for up to 1 hour. Promoted users don't get new permissions until next refresh.
- **Fix:** Increment `permissionsVersion` on role change. Validate version in middleware. Force token refresh if mismatched.

### HIGH-13: No Insurance Expiry Background Check
- **Feature:** Carrier Management
- **File:** `hussle-app-dispatch-api/src/shared/onboardingGate.ts`
- **Issue:** Insurance expiry is only checked at the moment of the onboarding gate check. No background job monitors expiring insurance.
- **Impact:** Carrier's insurance could expire mid-load assignment with no warning or blocking.
- **Fix:** Create nightly job that checks all carriers' insuranceExpiry. Flag/block carriers with expired insurance.

### HIGH-14: No Expired Document Enforcement
- **Feature:** Document Management
- **File:** `hussle-app-dispatch-api/src/documents/services/documentService.ts`
- **Issue:** Documents have `expiresAt` field but system never enforces expiry. Expired insurance certs and W9s remain "valid" indefinitely. No S3 cleanup.
- **Impact:** Compliance risk — carriers dispatched with expired insurance. Storage cost from never-deleted expired docs.
- **Fix:** Background job to flag expired documents. Update onboarding gate to check document expiry.

### HIGH-15: Settlement PDF Download Button Missing from UI
- **Feature:** Accounting & Finance
- **File:** `hussle-app-dispatch-ui/src/features/accounting/pages/SettlementDetailPage/index.tsx`
- **Issue:** API has `GET /settlements/:id/pdf` endpoint but UI doesn't expose a download button.
- **Impact:** Users must use API directly to get settlement PDFs.
- **Fix:** Add "Download PDF" button to SettlementDetailPage header actions.

### HIGH-16: No Receipt Upload UI for Dispatchers
- **Feature:** Accounting & Finance
- **File:** `hussle-app-dispatch-api/src/expenses/controllers/receiptController.ts`
- **Issue:** Receipt presign + confirm endpoints fully implemented. No UI for dispatchers to upload receipts.
- **Impact:** Receipt uploads only possible via driver portal or API.
- **Fix:** Add receipt upload button to expense detail/edit drawer.

### HIGH-17: Vehicle Finance Fields Orphaned
- **Feature:** Vehicle Management
- **File:** `hussle-app-dispatch-api/prisma/schema.prisma` (lines 669-672)
- **Issue:** Vehicle model has `lenderName`, `loanPayment`, `loanInterestRate`, `insuranceMonthlyCost` — none exposed in UI.
- **Impact:** Cannot track vehicle financing from the application.
- **Fix:** Add finance section to VehicleInfoDrawer or create VehicleFinanceDrawer.

### HIGH-18: Vehicle Weekly Revenue Chart Hardcoded Empty
- **Feature:** Vehicle Management
- **File:** `hussle-app-dispatch-ui/src/features/vehicle/components/VehicleDetailPage/VehicleOverviewTab.tsx` (line 66)
- **Issue:** Weekly revenue chart data is hardcoded as empty array `[]`. No load revenue aggregation per vehicle.
- **Impact:** Vehicle performance tracking shows nothing.
- **Fix:** Wire to load revenue query grouped by vehicle + week.

### HIGH-19: No Driver Location Update Endpoint
- **Feature:** Driver Management
- **File:** `hussle-app-dispatch-api/src/drivers/routes/driverRoutes.ts`
- **Issue:** Driver model has `currentCity`, `currentState`, `currentLatitude`, `currentLongitude` but no API endpoint to update them. Location drawer exists in UI but may not save.
- **Impact:** Deadhead calculations use stale location data. No way to track where drivers are between loads.
- **Fix:** Add `PATCH /drivers/:id/location` endpoint with lat/lng/city/state fields.

### HIGH-20: Market Data Requires Manual Push
- **Feature:** Load Intelligence
- **File:** `hussle-app-dispatch-api/src/load-intel/services/marketDataService.ts`
- **Issue:** Market tier data only updates when an external system pushes to `POST /load-intel/market-data`. No automatic refresh from DAT or other market data providers.
- **Impact:** Scoring uses stale or default market data (15 points fallback). Load recommendations may be inaccurate.
- **Fix:** Either integrate with a market data API for periodic refresh, or clearly document the manual process for dispatchers.

---

## Medium Priority Issues

### Invoicing
- No validation: can invoice without customer assigned (customerId optional)
- No validation: can send invoice without signed BOL (only flagged, not blocked)
- Email sender hardcoded to `invoices@fleetcommand.app`
- Company logo available in PDF data but never rendered in template
- Search in invoice list page not wired to saga
- No accessorial line item breakdown in detail UI

### Load Management
- Financial field freeze enforced at API but UI doesn't disable edit fields after DISPATCHED
- Prohibited commodities checked by API only, no UI pre-check
- TONU charge amount hardcoded at $250 (not configurable per org)
- Notes required for TONU in UI but not in API (misalignment)
- Assignment-dispatch workflow: separate API calls with no rollback on partial failure
- Detention charge dedup: manual + auto-generated can coexist for same stop
- No validation of stop appointment dates against current time
- No constraint on driver pay exceeding carrier payout

### Load Tracking
- No real-time tracking (no WebSocket/SSE) — broker must refresh for updates
- GPS optional — drivers without GPS get no location recorded
- Check-in not required — driver can advance status without location/notes
- No geofencing for auto-detecting arrival at stop coordinates
- ETA not validated against appointment window

### Document Management
- No virus scanning on uploaded PDFs
- No document signing UI (signature fields in DB but not exposed)
- Archived document versions not visible in UI
- Presign URL expires in 15 min — slow uploads fail without retry
- S3 keys predictable (org/load/type/filename) — enumeration possible

### Customer Notifications
- Carrier onboarding complete email rendered but never sent (TODO comment)
- Default notification state unclear — zero customer settings = silent no-send
- No retry mechanism for failed notifications
- No rate limiting on notification sends
- SMS defaults to console in dev environments

### Accounting & Finance
- Settlement dual-rounding: intermediate values rounded before final
- No financial snapshot/hash to detect post-generation tampering
- No settlement financial freeze when approved/paid
- Recurring expense cron job not configured
- Expense list page hardcodes `limit: 500` with no pagination UI

### Carrier Management
- No unique MC number validation within organization
- Double approval possible (no idempotency check)
- Rejection reason not persisted to Carrier record
- Invite token stored in plaintext (should be hashed)
- Cost analysis phase has no backend validation
- Carrier name field has no max length
- Invite resend has no rate limiting
- Dispatch terms field mismatch: UI edits `companyMarginPercent`, API has `dispatchFeePercent`

### Auth & User Management
- No audit logging for auth events (login, logout, org switch, role change)
- Refresh token not bound to user context (IP, user-agent)
- Single-session mode not default
- No invite resend or revoke UI
- No password self-change endpoint (only forgot-password flow)
- No MFA/2FA enabled
- Hardcoded 1-hour access token TTL

### Dashboard
- Company margin calculation undefined (frontend expects it, backend doesn't compute it)
- No attention items pagination — retrieves ALL matching records
- No dashboard caching — each page visit = 8+ DB queries
- No auto-refresh or polling — requires manual page reload

### Load Intelligence
- Chain building performance — sequential backhaul searches per load
- Feed filtering partially client-side only (market strength, search)
- Dedup hash weak — first 12 chars of SHA256
- Chain cache not invalidated when loads are booked/dismissed
- No bulk dismiss/archive UI

### Driver Management
- No UI for editing preferred lanes or no-go zones
- maxDaysOut preference not displayed anywhere
- Available hours field exists but not in UI
- Timezone not user-configurable (defaults to America/Chicago)
- License expiry stored but no warning/alert system
- Endorsements not displayed in detail overview

### Vehicle Management
- Vehicle category field unused (VehicleCategory enum never used)
- Recurring expenses model separate from TruckExpense UI
- No fuel card provider configuration
- Subscription seat limit only checked on create, not on list

### Customer Management
- No billing/factoring configuration
- Revenue and AR stats not wired to list view (shows dashes)
- Export button visible but non-functional
- Customer type limited to 3 hardcoded options
- Notes save mechanism not implemented

### Contact Management
- Role is freeform string — no enum or standardization
- No contact type (primary/secondary)
- No email/phone verification
- No batch operations

### Place Management
- Facility hours editor missing from create/edit forms
- No seasonal closures or holiday hours
- No dock capacity tracking
- Rate limiting on geocoding is global, not per-user

---

## Architecture Strengths

These are things that are well-built and should be preserved:

1. **Load status state machine** — clean, well-defined transitions with side effect tags
2. **Decimal.js in core financials** — settlements and load calculations use banker's rounding
3. **Event-driven architecture** — RabbitMQ pub/sub decouples domain events from side effects
4. **Port-based abstractions** — email/SMS services pluggable (console/SES/SMTP/Twilio)
5. **Presign upload pattern** — S3 direct upload minimizes backend storage handling
6. **Dual-level notification preferences** — customer defaults + load-specific overrides
7. **Carrier onboarding portal** — conversational questionnaire with 6 phases and auto-save
8. **Typed error classes** — NotFoundError, ValidationError, ForbiddenError throughout
9. **Yup validation on all inputs** — consistent request validation pattern
10. **Soft delete pattern** — deletedAt timestamps preserve data integrity

---

## Next Steps

1. Fix critical blockers (CRIT-01 through CRIT-10) — these are production-blocking
2. Fix high priority issues (HIGH-01 through HIGH-20) — these affect core workflows
3. Write Product Overview document (stakeholders) — informed by audit findings
4. Write User Guide document (end users) — informed by audit findings
5. Playwright walkthrough with screenshots — visual confirmation pass
