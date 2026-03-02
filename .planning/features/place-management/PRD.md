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

# Feature 3: place-management

## Summary

Places CRUD with facility intelligence fields (type, dock, hours, appointment/lumper/PPE requirements), typeahead API for stop forms, geo auto-lookup from Redis city centroids on save, and a reusable PlaceTypeahead component used later by load-management.

## Scope

**Does:**
- Places CRUD: create, read, update, soft-delete
- Place list page with sort/filter/search, pagination
- Place detail page with all fields + "Recent loads at this facility" section
- Create/edit form (3 sections: Location, Facility Details, Contact & Intelligence)
- Typeahead API: search by name/city/state (min 2 chars), returns matching places with facility type badge + contact name
- Geo auto-lookup: on save, resolve city+state to lat/lng from Redis centroids
- PlaceTypeahead reusable component (consumed by load-management stop forms)

**Does NOT:**
- Create or modify loads (that's load-management)
- Handle stop creation (that's load-management)
- Manage contacts (that's fleet-management)

## Capabilities

1. Place list page: table with name, city/state, facility type, associated contact, appointment required badge. Sortable: name, city, state, facility type, created date. Filterable: facility type, state, associated contact. Searchable: name, city, state. Pagination: 25/page.
2. Create/edit form: Location (name, address, city, state, zip, lat/lng auto), Facility Details (type dropdown with 16 options, dock type, hours, toggles), Contact & Intelligence (associated contact, on-site contact, check-in procedures, notes)
3. Typeahead: `GET /api/v1/places/typeahead?q=&limit=10` — min 2 chars, returns `{name} — {city}, {state}` with type badge and contact name. On selection: auto-fill address/contact fields. Excludes soft-deleted places.
4. Geo auto-lookup: getCityCoords from foundation's Redis hash, set geoSource=AUTO. Manual override option.

## Success Criteria

- GIVEN city "Charlotte", state "NC" WHEN Place saved THEN lat/lng auto-populate from Redis
- GIVEN Place "Amazon FTW1" exists WHEN dispatcher types "Amazon" in stop form THEN typeahead shows it
- GIVEN Place selected on stop WHEN auto-fill runs THEN address/contact fields populate, all editable
- GIVEN Place soft-deleted WHEN dispatcher searches THEN excluded from typeahead
- GIVEN Place with lumperRequired=true WHEN selected on stop THEN info badge shown
- GIVEN Place linked to Contact "TQL" WHEN searching "TQL" in typeahead THEN associated Places appear

## Data Requirements

**Prisma models (defined in foundation, consumed here):**
- Place (lines 631-668) — all fields including facility intelligence

**Depends on from foundation:**
- Geo lookup utility (`getCityCoords`)
- Pagination helper
- Error classes
- Auth middleware

## User Flows

**Create a Place:**
1. Navigate to Places → "Create Place"
2. Fill Location: name="Amazon FTW1", city="Fort Worth", state="TX"
3. Fill Facility: type=Distribution Center, dock=Dock High, appointment required=ON
4. Fill Contact: associated contact (searchable dropdown), check-in procedures
5. Save → lat/lng auto-populated from Redis, place appears in list

**Use PlaceTypeahead in Load Creator:**
1. In load creation Step 1, type "Amazon" in stop facility field
2. Typeahead shows: "Amazon FTW1 — Fort Worth, TX [Distribution Center]"
3. Select → address, city, state, zip, contact auto-fill into stop fields
4. All auto-filled fields remain editable for that specific load
5. "+" button opens modal to create new Place from entered stop data

## Affected Services

- `hussle-app-dispatch-api` — Places module (routes, controller, service, validation)
- `hussle-app-dispatch-ui` — Place list page, Place detail page, PlaceTypeahead component

## Technical Context

**mocho-ui components:**
`PageWrapper`, `PageHeader`, `MainCard`, `DataGrid`/`ActionsCell`, `FormDialog`, `TextField`, `SelectField`, `EmptyState`, `ListSkeleton`, `FormSkeleton`, `createCrudSlice`, `createEntityModule`, `useFormRef`

**Key technical decisions:**
- PlaceTypeahead is a reusable component — load-management imports it for stop forms
- Geo auto-lookup happens server-side on create/update, not client-side
- Place soft-delete preserves existing stop references (placeId stays on stops)
- Typeahead endpoint is separate from list endpoint for performance (no pagination overhead)

**API Endpoints:**

```
GET    /api/v1/places                       ?page=&limit=&search=&facilityType=&state=&contactId=&sort=&order=
GET    /api/v1/places/:id
POST   /api/v1/places
PATCH  /api/v1/places/:id
DELETE /api/v1/places/:id                   # Soft delete
GET    /api/v1/places/typeahead             ?q=&limit=10
```

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.11 Place Management | 764-806 |
| `docs/tdd.md` | Place model | 631-668 |
| `docs/tdd.md` | P0 Places endpoints | 1436-1442 |

## Screenshots

None in `docs/screenshots/` for place-management specifically. The place typeahead is visible in the load creation screenshots.

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 764-806 (Place Management). TDD has Place model at lines 631-668 and endpoints at 1436-1442. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Generate BE stories for places CRUD + typeahead + geo auto-lookup, FE stories for list/detail/form pages + reusable PlaceTypeahead component.

## Dependencies

- **foundation** — Prisma schema (Place model), geo lookup, pagination, error classes, auth middleware
