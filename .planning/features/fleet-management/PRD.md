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

# Feature 2: fleet-management

## Summary

Full CRUD for carriers, drivers, vehicles, and contacts with carrier onboarding gate enforcement, driver preferences (lanes, no-go zones, home base), vehicle CPM expense tracking, and list/detail pages for each entity.

## Scope

**Does:**
- Carriers CRUD (create, read, update, soft-delete) with onboarding fields + dispatch agreement handling
- Drivers CRUD with preferences: home base, max days out, preferred lanes, no-go zones
- Vehicles CRUD with CPM expense editor (monthly costs → cost per mile → daily min revenue)
- Contacts CRUD (broker, shipper, consignee, factoring)
- Onboarding gate enforcement on load assignment for EXTERNAL_CARRIER
- Insurance expiry tracking (30-day and 7-day warnings)
- Carrier list/detail pages, driver detail with preferences editor, vehicle detail with CPM editor
- Delete constraints: cannot deactivate carrier/driver/vehicle with active loads

**Does NOT:**
- Implement load assignment UI (that's load-management)
- Implement document upload flow (that's documents-bol — carrier onboarding doc booleans are set manually in MVP)
- Implement dispatch agreement PDF generation or email sending (that's invoicing/email)
- Implement driver fit scoring (that's foundation utilities consumed by load-intelligence)

## Capabilities

1. Carrier list: name, type badge, MC#, status, onboarding status (complete/incomplete), driver count, vehicle count
2. Carrier detail: contact info, compliance, financial terms (fee %, split %, feeIncludesAccessorials toggle), onboarding doc section with upload slots + indicators, drivers/vehicles/load-history tabs, insurance expiry warning
3. Driver detail: standard info, operational (availableHours, currentCity/State), preferences section (home base, maxDaysOut, preferred lanes table, no-go zones list)
4. Vehicle detail: ownership, emergency contact, warranty, CPM expense editor (same categories as existing CPM Calculator), auto-calculated monthly cost, cost per mile, daily minimum revenue
5. Contact CRUD: type-based (broker, shipper, consignee, factoring), payment terms, quick pay discount
6. Onboarding gate: blocks EXTERNAL_CARRIER load assignment if missing dispatch agreement, insurance cert (or expired), or W-9

## Success Criteria

- GIVEN a new external carrier with no documents WHEN ADMIN tries to assign to a load THEN blocked: "Missing: Dispatch Agreement, Insurance Certificate, W-9"
- GIVEN a carrier with expired insurance WHEN assignment attempted THEN blocked: "[Carrier] insurance expired on [date]"
- GIVEN a carrier with all docs on file and valid insurance WHEN assigned to load THEN assignment succeeds
- GIVEN COMPANY_ASSET carrier WHEN assigned to load THEN no onboarding gate check
- GIVEN external carrier missing insurance WHEN viewed THEN onboarding status shows "Incomplete" with missing items listed
- GIVEN vehicle with CPM expenses totaling $8,500/month and 10,000 miles target THEN CPM shows $0.85/mile
- GIVEN carrier with active load WHEN deactivation attempted THEN blocked with load list
- GIVEN driver with MT no-go WHEN assigning to Montana load THEN warning displayed (requires confirmation)
- GIVEN driver with NJ→PA preferred WHEN assigning NJ→PA load THEN "Preferred Lane" badge

## Data Requirements

**Prisma models (defined in foundation, consumed here):**
- Carrier (lines 274-322) — all fields
- Driver (lines 400-431) — all fields including preferences (preferredLanes, noGoZones JSON)
- Vehicle (lines 433-465) — all fields
- TruckExpense (lines 482-495) — expense categories for CPM
- Contact (lines 361-391) — all fields

**Depends on from foundation:**
- Onboarding gate utility (`checkCarrierOnboarding`)
- Pagination helper
- Error classes
- Auth middleware (role checks)

## User Flows

**Create External Carrier:**
1. ADMIN navigates to Carriers → clicks "Add Carrier"
2. Fills in name, type=EXTERNAL_CARRIER, MC#, contact info, financial terms
3. Saves → carrier created with onboarding status "Incomplete"
4. Uploads dispatch agreement, insurance cert, W-9 (toggles booleans in MVP)
5. Onboarding status becomes "Complete"

**Add Driver with Preferences:**
1. Navigate to carrier detail → Drivers tab → "Add Driver"
2. Fill in name, phone, CDL info
3. Set home base (city + state), max days out
4. Add preferred lanes (origin state → dest state, optional city refinement)
5. Add no-go zones (state, optional city)
6. Save

**CPM Expense Setup:**
1. Navigate to vehicle detail → "Edit Expenses"
2. Add expense rows: category (Fixed/Variable/Service/Wage/Deduction), key, label, monthly amount
3. System auto-calculates: total monthly cost, CPM (monthly cost / monthly miles target), daily minimum

## Affected Services

- `hussle-app-dispatch-api` — Carrier, Driver, Vehicle, Contact modules (routes, controllers, services, validation)
- `hussle-app-dispatch-ui` — Carrier list/detail pages, driver detail, vehicle detail, contact components

## Technical Context

### Existing Code Leveraged

- **@mocho/ui components:** `PageWrapper`, `PageHeader`, `MainCard`, `DataGrid`/`ActionsCell`/`createActionsCell`, `FormDialog`, `DynamicForm`, `ConfirmDeleteDialog`, `EmptyState`, `Avatar`, `Dot`, `Tabs`, `ListSkeleton`, `FormSkeleton`, `Snackbar` (notistack), `Breadcrumbs`
- **@mocho/ui/redux:** `createEntityModule` (factory for slice + sagas + selectors), `createCrudSlice`, `createCrudSagas`, `createCrudSelectors`, `CrudPageState`, `LoadingState`
- **@mocho/ui/forms:** `useFormRef`, `useDirtyFormBlocker`, `FormHandle`
- **@mocho/ui/hooks:** `usePagination` (page/size/offset state management)
- **dispatch-ui store:** `useDispatch`/`useSelector` from `store` (typed), rootReducer `{ pages, entities }` pattern, rootSaga ready for watchers
- **dispatch-ui utils:** `axiosInstance` from `src/utils/axios.ts` (configured with auth interceptor)
- **Foundation utilities (from hussle-app-dispatch-api):** `checkCarrierOnboarding` (onboarding gate), pagination helper, typed error classes, auth middleware

### Key Technical Decisions

- Driver preferences stored as JSON fields (preferredLanes, noGoZones) — not separate tables
- CPM calculated client-side from expense data, not stored as a separate field
- Onboarding booleans set manually in MVP (no automated document verification)
- Soft delete via `deletedAt` timestamp — queries filter `WHERE deletedAt IS NULL`
- Performance stats on detail pages show placeholders until load-management is built
- Carrier portal (self-service) is excluded — admin-facing only
- FMCSA verification excluded (shown as "Coming Soon" in designs)
- Driver fit endpoint (/drivers/:id/fit) belongs to load-intelligence, not this feature
- TruckExpense managed via replace-all pattern on vehicle PATCH (not separate endpoints)

### Cross-Feature Decisions Encoded

- L-001 (Express + Prisma), L-002 (Decimal.js banker's rounding), L-009 (UUID IDs), L-010 (offset pagination) — all enforced in story acceptance criteria
- Foundation BE-005 provides `checkCarrierOnboarding` — fleet-management BE-001 consumes it
- `dispatch-api` service key not yet in packages.json — created by foundation BE-001

**API Endpoints (this feature):**

```
GET    /api/v1/carriers                     ?page=&limit=&type=&search=&sort=&order=
POST   /api/v1/carriers
PATCH  /api/v1/carriers/:id
DELETE /api/v1/carriers/:id                 # Soft delete
GET    /api/v1/carriers/:id/onboarding

GET    /api/v1/drivers                      ?page=&limit=&carrierId=&search=&sort=&order=
POST   /api/v1/drivers
PATCH  /api/v1/drivers/:id                  # Includes preferences JSON
DELETE /api/v1/drivers/:id                  # Soft delete

GET    /api/v1/vehicles                     ?page=&limit=&carrierId=&search=&sort=&order=
POST   /api/v1/vehicles
PATCH  /api/v1/vehicles/:id                 # Includes expenses[] replacement
DELETE /api/v1/vehicles/:id                 # Soft delete

GET    /api/v1/contacts                     ?page=&limit=&type=&search=&sort=&order=
POST   /api/v1/contacts
PATCH  /api/v1/contacts/:id
DELETE /api/v1/contacts/:id                 # Soft delete
```

**Not in this feature (moved to load-intelligence):**
```
GET    /api/v1/drivers/:id/fit              ?originState=&destState=&destCity=
```

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.6 Carrier Onboarding | 355-400 |
| `docs/prd.md` | S4.9 Fleet & Carrier Management | 688-738 |
| `docs/tdd.md` | Carrier, Driver, Vehicle, Contact, TruckExpense models | 274-503 |
| `docs/tdd.md` | S6 Onboarding Gate | 1074-1105 |
| `docs/tdd.md` | P0 Carriers/Drivers/Vehicles/Contacts endpoints | 1413-1447 |

## Screenshots

- `docs/screenshots/carrier_details.png`
- `docs/screenshots/carrier_onboarding.png`
- `docs/screenshots/carrier_onboarding_details.png`
- `docs/screenshots/driver_details.png`

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 355-400 (Carrier Onboarding) and 688-738 (Fleet & Carrier Management). TDD has models at lines 274-498 and endpoints at 1413-1447. Screenshots in docs/screenshots/: carrier_details.png, carrier_onboarding.png, carrier_onboarding_details.png, driver_details.png. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Generate BE stories for carriers/drivers/vehicles/contacts CRUD + onboarding gate, FE stories for list/detail pages.

## Dependencies

- **foundation** — Prisma schema, onboarding gate, pagination, error classes, auth middleware
