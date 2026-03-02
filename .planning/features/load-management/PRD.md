# Shared Context Preamble

> Every feature PRD should carry this context. It defines the business rules, roles, and patterns that span the entire system.

## Business Model

**Two Carrier Types, Two Financial Flows:**

- **COMPANY_ASSET (Own Fleet):** Company owns/leases the truck. Broker pays the company the full load rate. Dispatch fee calculated as percentage of load rate (or rate + accessorials if configured), split between company and Jr.
- **EXTERNAL_CARRIER (Dispatch Service):** Company dispatches for independent carriers with their own MC. Carrier must complete onboarding before load assignment. Broker pays carrier directly. Carrier pays company a dispatch fee, split between company and Jr.
- **OWNER_OPERATOR:** In data model but NOT implemented in MVP. System rejects attempts to use this carrier type.

**Financial Rules:**

| Rule | Formula |
|------|---------|
| Dispatch fee | `customerRate × feePercent` (or `(customerRate + accessorials) × feePercent` if carrier has feeIncludesAccessorials) |
| Partner split | `dispatchFee × partnerSplitPercent` |
| Company share | `dispatchFee − partnerSplit` |
| Rounding | Banker's rounding (half to even), 2 decimal places, applied once at final stored value |

**Financial field lifecycle:**
- QUOTED: customerRate may be set, financial fields are null
- BOOKED (carrier assigned): dispatchFee, partnerSplit, ratePerMile calculated and stored
- If carrier or rate changes while BOOKED: financials recalculate
- DISPATCHED and beyond: financial fields are frozen

**DISPATCHER role restriction:** API never includes partnerSplit in responses to DISPATCHER users.

**Prohibited Commodities:** Configurable per org. Default: garbage, refuse, recyclables, dirty recyclables. Checked only in Load Creator (not load intelligence).

## Role Permissions Matrix

| Permission | ADMIN | DISPATCHER | VIEWER |
|-----------|-------|------------|--------|
| Full access to all features | Yes | — | — |
| Create/manage loads | Yes | Yes | — |
| Upload broker rate cons | Yes | Yes | — |
| Update load statuses | Yes | Yes (except EXCEPTION, PAID) | — |
| Generate invoice drafts | Yes | Yes | — |
| Approve/send invoices | Yes | — | — |
| View carriers/drivers/vehicles/places | Yes | Yes | Yes (read-only) |
| Create/edit places | Yes | Yes | — |
| Delete carriers/drivers/vehicles/places | Yes | — | — |
| See partner split amounts | Yes | — | — |
| See financial data | Yes | Yes | — |
| Flag EXCEPTION | Yes | — | — |
| Mark PAID | Yes | — | — |
| Access load intelligence feed | Yes | Yes | — |
| View dispatch board (read-only) | Yes | Yes | Yes |
| Invite users | Yes | — | — |
| Cancel loads | Yes | Yes | — |

## State Machine Overview

**13 Statuses:** QUOTED → BOOKED → DISPATCHED → EN_ROUTE_PICKUP → AT_PICKUP → IN_TRANSIT → AT_DELIVERY → DELIVERED → INVOICE_PENDING → INVOICED → PAID. Plus EXCEPTION, CANCELED, TONU.

**Kanban Groups:**

| Column | Color | Statuses |
|--------|-------|----------|
| NEW | Yellow | QUOTED |
| BOOKED | Orange | BOOKED |
| ACTIVE | Green | DISPATCHED, EN_ROUTE_PICKUP, AT_PICKUP, IN_TRANSIT, AT_DELIVERY |
| DELIVERED | Purple | DELIVERED, INVOICE_PENDING |
| COMPLETE | Gray | INVOICED, PAID |
| ISSUES | Red | EXCEPTION, CANCELED, TONU |

**Transition Map:**

| From | Can Go To | Who |
|------|-----------|-----|
| QUOTED | BOOKED, CANCELED | ADMIN, DISPATCHER |
| BOOKED | DISPATCHED, CANCELED | ADMIN, DISPATCHER |
| DISPATCHED | EN_ROUTE_PICKUP, TONU, CANCELED | ADMIN, DISPATCHER |
| EN_ROUTE_PICKUP | AT_PICKUP, TONU | ADMIN, DISPATCHER |
| AT_PICKUP | IN_TRANSIT, TONU | ADMIN, DISPATCHER |
| IN_TRANSIT | AT_DELIVERY, EXCEPTION | ADMIN, DISP (Exception: ADMIN only) |
| AT_DELIVERY | DELIVERED, EXCEPTION | ADMIN, DISP (Exception: ADMIN only) |
| DELIVERED | INVOICE_PENDING, EXCEPTION | System (auto), ADMIN for Exception |
| INVOICE_PENDING | INVOICED | ADMIN (via invoice approval) |
| INVOICED | PAID | ADMIN (via mark paid) |
| PAID | (terminal) | — |
| EXCEPTION | INVOICED | ADMIN |
| CANCELED | (terminal) | — |
| TONU | INVOICED | ADMIN, DISPATCHER |

**Prerequisites:** BOOKED requires carrier. DISPATCHED requires driver + vehicle + onboarding gate (external). CANCELED/EXCEPTION require notes. TONU auto-creates $250 accessorial.

**Side Effects:** → BOOKED: calculate financials. → DISPATCHED: freeze financials. → DELIVERED: auto-generate invoice, → INVOICE_PENDING. → TONU: auto $250 accessorial + invoice. Every transition: LoadStatusHistory record.

**Warnings (soft):** → DISPATCHED without rate con. → DELIVERED without signed BOL. → DISPATCHED with driver < 10 available hours.

## Error Handling Patterns

All features must use typed error classes extending a common base. Specific patterns:

| Scenario | UX |
|----------|-----|
| Invalid status transition | Toast: "Cannot move to [status]. Allowed: [list]" |
| Concurrent edit | "Updated by [user] at [time]. Please refresh." |
| S3 upload fails | "Upload failed. Try again." Retry button. |
| Email fails (3 retries) | "Email failed. PDF saved — download manually." |
| Onboarding docs missing | Hard block: "[Carrier] missing: [doc list]. Complete onboarding first." |
| Insurance expired | Hard block: "[Carrier] insurance expired [date]." |
| Prohibited commodity | Hard block: "This commodity is prohibited per company policy." |
| Dispatching without rate con | Soft warning: "No broker rate con on file. Continue anyway?" |
| Invoice without signed BOL | Warning flag: "Missing signed BOL." |
| Driver no-go zone | Warning: "[Driver] has [state] as no-go zone. Assign anyway?" |
| Redis unavailable | Intel feed: "Load intelligence temporarily unavailable." Dispatch board unaffected. |
| Chrome extension: DOM changed | Extension pauses: "DAT layout may have changed — update available" |

## Directory Mapping (TDD → Actual Paths)

| TDD Reference | Actual Directory | Notes |
|---------------|-----------------|-------|
| `packages/api/` | `hussle-app-dispatch-api/` | Express + Prisma backend |
| `packages/web/` | `hussle-app-dispatch-ui/` | React + Vite + MUI frontend |
| `packages/shared/` | `mocho-ui/` (partial) | Component library; shared types/utils may need a new shared package or go in api |
| `extension/` | Created during chrome-extension feature | Chrome Extension (Manifest V3) |

## Pagination Standard

- Offset-based, default 25, max 100
- Response: `{ data, meta: { page, limit, total, totalPages, hasMore } }`
- Sort: `?sort=field&order=asc|desc` (default: createdAt desc)
- Decimals serialized as strings in JSON
- Intelligence feed: paginated from Redis sorted set, not Postgres

## Sequential Number Generation

- Load: `LD-{YYYY}-{NNNNNN}` — continuous, no annual reset
- Invoice: `INV-{YYYY}-{NNNNNN}` — continuous
- Postgres sequence. Retry on collision (max 3).

## Presigned URL Upload Flow

1. Frontend requests presigned URL: `POST /api/v1/documents/presign`
2. API generates S3 PUT URL (15-min expiry) + document record in "pending" state
3. Frontend uploads directly to S3
4. Frontend confirms: `POST /api/v1/documents/{id}/confirm`
5. API verifies file exists, updates record to "confirmed"

S3 structure: `{orgId}/loads/{loadId}/{type}/{filename}` and `{orgId}/carriers/{carrierId}/{type}/{filename}`. File limits: PDFs max 5MB, uploads max 10MB. Accepted: PDF, PNG, JPG, JPEG.

---

# PRD — Load Management

| Field | Value |
|-------|-------|
| Feature Key | load-management |
| Created | 2026-03-01 |
| Phase | INTAKE |

## Summary

The core dispatch feature: Load CRUD with 13-status state machine (transitions, prerequisites, warnings, side effects), multi-step load creator (4 steps), dispatch board (6-column Kanban + table view with sort/filter/search), load detail page, weekly gross tracker, broker rate con tracking, check calls, status history, and driver fit integration.

## Scope

**Does:**
- Load CRUD with full validation (stops, carrier/driver/vehicle ownership, prohibited commodities)
- State machine enforcement: transitions, prerequisites, warnings, side effects (calculate financials, freeze financials, auto-generate invoice, TONU accessorial)
- Multi-step Load Creator: Route & Broker (with PlaceTypeahead), Cargo, Assignment & Rate (with driver fit warnings + onboarding gate), Review & Create
- Dispatch board: 6-column Kanban + table view, card contents, sort/filter/search, 15s polling
- Weekly gross tracker per truck ($5,000 target)
- Load detail page: route, broker info, assignment, financial, planned backhaul, status timeline, check calls, documents, invoice
- Status change dialog with confirmation, notes for EXCEPTION/CANCELED
- Check calls: log with location, ETA, notes, broker notified flag
- Broker rate con tracking (rateConReceivedAt, warnings)

**Does NOT:**
- Implement document upload flow (that's documents-bol — load-management calls document module APIs)
- Implement invoice generation logic (that's invoicing — state machine fires event, invoicing handles it)
- Implement intelligence feed or scoring (that's load-intelligence — loads created from intel are pre-filled)
- Implement email sending (that's invoicing)

## Capabilities

1. **Dispatch Board Kanban:** 6 columns (NEW/BOOKED/ACTIVE/DELIVERED/COMPLETE/ISSUES), cards show load number, route, carrier+type, driver, rate (hidden for VIEWER), status badge, pickup date, urgency indicator. Not draggable. COMPLETE collapsed by default. Mobile: card list only.
2. **Table View:** Sortable (load#, status, carrier, origin, dest, pickup, rate, created). Filterable (status, carrier, type, equipment, date range). Searchable (load#, broker ref, carrier, city). 25/page.
3. **Load Creator Step 1:** Broker (searchable from Contacts), broker ref, equipment type, PlaceTypeahead for stops, auto-fill from places, "Save as Place" quick action, add stop button.
4. **Load Creator Step 2:** Commodity (prohibited check), weight, piece count, hazmat, tarp (auto-suggest $150-200 accessorial), team driver, loaded/deadhead miles.
5. **Load Creator Step 3:** Carrier (active only, onboarding gate for external), driver (filtered to carrier, fit warnings: preferred lane badge, no-go warning, days from home, available hours, current location, active load warning), vehicle (filtered, auto-select if single), customer rate (min book rate helper if from intel), accessorials, financial preview.
6. **Load Creator Step 4:** Summary, financial breakdown, planned backhaul (if from Book Chain), notes, "Create as Quoted" or "Create as Booked", prompt to upload rate con.
7. **Load Detail:** All sections with status-appropriate actions, planned backhaul panel (if booked via chain), status timeline, check calls.
8. **Weekly Gross Tracker:** Per truck: "Truck #133718: $3,200 / $5,000" with progress bar. ADMIN/DISPATCHER only.

## Success Criteria

- GIVEN no filters WHEN dispatch board loads THEN all non-deleted loads display in correct Kanban columns
- GIVEN VIEWER role WHEN viewing board THEN rates are hidden on all cards
- GIVEN 5 active trucks WHEN board loads THEN weekly gross tracker shows all 5 with progress toward $5,000
- GIVEN a prohibited commodity entered WHEN user submits THEN creation is blocked with policy message
- GIVEN an external carrier missing W-9 WHEN dispatcher tries to assign THEN assignment is blocked with list of missing documents
- GIVEN a carrier with one driver and one vehicle WHEN selected THEN both auto-populate
- GIVEN DISPATCHER role WHEN viewing financial preview THEN partner split is hidden
- GIVEN driver has Montana as no-go zone WHEN assigning to Montana load THEN warning: "[Driver] has Montana as a no-go zone. Assign anyway?"
- GIVEN driver has NJ→PA preferred lane WHEN assigning to NJ→PA load THEN "Preferred Lane" badge shown
- GIVEN load created from intelligence feed WHEN rate field displays THEN min book rate shown as helper text
- GIVEN load created from "Book Chain" WHEN review step displays THEN planned backhaul summary shown
- GIVEN Place "Amazon FTW1" exists WHEN dispatcher types "Amazon" in stop form THEN typeahead shows it
- GIVEN load in DISPATCHED WHEN ADMIN or DISPATCHER views THEN primary action is "Mark En Route to Pickup"
- GIVEN load in IN_TRANSIT WHEN DISPATCHER tries EXCEPTION THEN rejected (ADMIN only)
- GIVEN VIEWER role WHEN viewing THEN financials hidden, no action buttons
- GIVEN load created from "Book Chain" WHEN load detail viewed THEN Planned Backhaul section is visible

## Data Requirements

**Prisma models (defined in foundation, consumed here):**
- Load (lines 505-573) — all fields
- Stop (lines 592-621) — all fields
- LoadStatusHistory (lines 670-683)
- CheckCall (lines 685-703)
- AccessorialCharge (lines 705-731)

**Depends on from foundation:**
- State machine (transitions, prerequisites, warnings, side effects)
- Financial calculations (`calculateLoadFinancials`)
- Onboarding gate (`checkCarrierOnboarding`)
- Sequence generator (load numbers)
- Pagination helper
- Error classes, auth middleware

## User Flows

**Create a Load (BOOKED):**
1. Dispatcher clicks "Create Load" on dispatch board
2. Step 1: Select broker from contacts, enter broker ref, choose equipment. Use PlaceTypeahead for pickup/delivery stops.
3. Step 2: Enter commodity (prohibited check), weight, miles.
4. Step 3: Select carrier (onboarding gate check), driver (fit warnings), vehicle. Enter customer rate. System shows financial preview.
5. Step 4: Review all details. Click "Create as Booked". Prompt: "Upload broker rate con now?"
6. Load created with status BOOKED, financials calculated.

**Transition Load through Lifecycle:**
1. BOOKED → DISPATCHED: click "Dispatch" on load detail, confirm. Warnings if no rate con or low driver hours.
2. DISPATCHED → EN_ROUTE_PICKUP → AT_PICKUP → IN_TRANSIT → AT_DELIVERY → DELIVERED: sequential status changes via primary action button.
3. DELIVERED → INVOICE_PENDING: automatic (side effect fires invoice generation event).

## Affected Services

- `hussle-app-dispatch-api` — Loads module (routes, controller, service, validation, stateMachine)
- `hussle-app-dispatch-ui` — DispatchBoard page, LoadCreate page, LoadDetail page, KanbanBoard/Column/Card, LoadTable, LoadCreatorStepper, StatusChangeDialog, WeeklyGrossTracker, PlannedBackhaulPanel, DriverFitBadge, BrokerRateConUpload

## Technical Context

**mocho-ui components:**
`PageWrapper`, `PageHeader`, `MainCard`, `Tabs`, `FormDialog`, `ConfirmDialog`, `TextField`, `SelectField`, `DateTimePickerField`, `Dot`, `LoadingButton`, `AnalyticEcommerce`, `EmptyState`, `Tooltip`, `createCrudSlice`, `createEntityModule`, `useFormRef`, `useDirtyFormBlocker`

**Key technical decisions:**
- Kanban cards are NOT draggable — status changes only via load detail
- 15-second polling for dispatch board refresh
- Financial fields frozen at DISPATCHED — no recalculation beyond that point
- PlannedNextLoadRef is a JSON field on Load, not a separate table
- Check calls are append-only (no edit/delete)
- State machine side effects use domain events (e.g., DELIVERED fires invoice generation — invoicing module handles it)
- Mobile (< 768px): card list only, no Kanban

**API Endpoints:**

```
GET    /api/v1/loads                        ?page=&limit=&status=&search=&sort=&order=
GET    /api/v1/loads/:id
POST   /api/v1/loads
PATCH  /api/v1/loads/:id
PATCH  /api/v1/loads/:id/status             { status, notes?, overrideWarnings? }
POST   /api/v1/loads/:id/check-calls
GET    /api/v1/loads/:id/check-calls
GET    /api/v1/loads/:id/status-history
GET    /api/v1/loads/:id/documents
```

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.1 Dispatch Board | 129-183 |
| `docs/prd.md` | S4.2 Load Creator | 184-257 |
| `docs/prd.md` | S4.3 Load Detail | 258-287 |
| `docs/prd.md` | S4.4 Broker Rate Con | 288-322 |
| `docs/prd.md` | S5 State Machine (transitions/side effects) | 809-877 |
| `docs/tdd.md` | Load, Stop, LoadStatusHistory, CheckCall, AccessorialCharge models | 505-731 |
| `docs/tdd.md` | S5 State Machine impl | 1010-1070 |
| `docs/tdd.md` | P0 Load endpoints | 1396-1412 |
| `docs/tdd.md` | P1 Load detail endpoints | 1460-1465 |

## Screenshots

- `docs/screenshots/dispatch_board.png`
- `docs/screenshots/dispatch_board_kanban.png`
- `docs/screenshots/dispatch_board_table.png`
- `docs/screenshots/create_load.png`
- `docs/screenshots/load_details.png`

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 129-322 (Dispatch Board, Load Creator, Load Detail, Broker Rate Con) and 809-877 (State Machine). TDD has models at lines 505-731, state machine at 1010-1070, endpoints at 1396-1412. Screenshots: dispatch_board.png, dispatch_board_kanban.png, dispatch_board_table.png, create_load.png, load_details.png. This feature depends on fleet-management and place-management. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Max 12 stories. Generate BE stories for load CRUD + state machine + side effects + check calls, FE stories for dispatch board (Kanban + table) + load creator stepper + load detail page.

## Dependencies

- **foundation** — Prisma schema, state machine, financials, onboarding gate, sequences, pagination, error classes
- **fleet-management** — Carrier/Driver/Vehicle data for assignment, onboarding gate enforcement
- **place-management** — PlaceTypeahead component for stop forms, place auto-fill
