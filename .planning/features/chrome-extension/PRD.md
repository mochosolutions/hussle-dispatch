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

# Feature 9: chrome-extension

## Summary

Chrome Extension (Manifest V3) that scrapes load data and market data from DAT load board in three modes (active page, auto-capture, bulk multi-tab), normalizes to LoadIntelPayload format, deduplicates client-side, and POSTs to the FleetCommand ingestion API.

## Scope

**Does:**
- Manifest V3 with service worker, content scripts, popup
- DAT scraper: DOM parser for load results with multiple selector fallback chains
- DAT market scraper: load-to-truck ratio from sidebar
- Three scraping modes: Active Page (on-demand), Auto-Capture (silent, 30s batching), Bulk Multi-Tab (scrape all open DAT tabs)
- Normalizer: DAT DOM data → LoadIntelPayload with `source: 'dat'` or `source: 'dat_bulk'`
- Client-side deduplication via hash cache
- API client for FleetCommand (ingest single, ingest batch, market data)
- Popup UI: mode toggles, status display, batch results
- Selector fallback chains for resilience against DAT layout changes
- Error handling: if selectors return 0 results, pause scraping, show "DAT layout may have changed"

**Does NOT:**
- Score loads (that's load-intelligence API)
- Store data persistently (sends to API, which stores in Redis)
- Handle authentication (uses existing FleetCommand auth token)
- Scrape any source other than DAT

## Capabilities

1. **Active Page Mode:** Dispatcher clicks "Send to FleetCommand" → scrapes current DAT results → batch POST to API
2. **Auto-Capture Mode:** Toggle ON → silently scrapes as dispatcher browses DAT, batches every 30s → POST
3. **Bulk Multi-Tab Mode:** "Bulk Scrape All Tabs" → scrapes all open DAT tabs in sequence → reports results
4. **Two data types captured:** Load data (origin, dest, rate, miles, equipment, broker, dates — NO commodity) and market data (load-to-truck ratio)
5. **DOM resilience:** Multiple selector fallback chains per field. If selectors return 0 results → pause, show warning
6. **Popup:** Mode toggles (active page, auto-capture), status indicators, bulk trigger, batch result display

## Success Criteria

- GIVEN auto-capture ON WHEN dispatcher browses 5 DAT pages THEN extension silently ingests all results into feed
- GIVEN "Bulk Scrape All Tabs" with 3 DAT tabs WHEN clicked THEN shows "3 searches, 142 loads, 98 new"
- GIVEN DAT layout changes WHEN selectors return 0 results THEN extension pauses, shows "DAT layout may have changed — update available"
- GIVEN a DAT page with load results WHEN "Send to FleetCommand" clicked THEN loads appear in intelligence feed with DAT source badge

## Data Requirements

No Prisma models. Extension produces `LoadIntelPayload` objects and `MarketData` snapshots, POSTed to load-intelligence API.

**TypeScript interfaces used:**
- `LoadIntelPayload` — from shared types
- `LoadSource: 'dat' | 'dat_bulk'` — source tags for DAT modes

## User Flows

**Active Page Scrape:**
1. Dispatcher is on DAT load board search results page
2. Clicks FleetCommand extension icon → "Send to FleetCommand"
3. Content script scrapes DOM → normalizer produces LoadIntelPayloads
4. Service worker POSTs batch to `/api/v1/load-intel/ingest/batch`
5. Popup shows: "24 loads scraped, 18 new, 6 duplicates"

**Auto-Capture:**
1. Dispatcher toggles "Auto-Capture" ON in extension popup
2. Browses DAT normally — each page load triggers content script
3. Every 30 seconds, service worker batches accumulated loads → POST
4. Status indicator in popup shows "Auto: 142 loads captured"

**Bulk Multi-Tab:**
1. Dispatcher has 3 DAT search tabs open (different lanes)
2. Clicks "Bulk Scrape All Tabs"
3. Extension iterates tabs, scrapes each → accumulates → batch POST
4. Shows: "3 searches, 142 loads, 98 new"

## Affected Services

- Chrome Extension only (standalone Manifest V3)
- Consumes: `hussle-app-dispatch-api` load-intel ingestion endpoints

## Technical Context

**mocho-ui components:** None (standalone extension, no mocho-ui)

**Extension directory structure (from TDD):**

```
extension/
├── manifest.json
├── background/
│   └── service-worker.ts          # Tab monitoring, batch queue, API
├── content/
│   ├── dat-scraper.ts             # DOM parser for DAT results
│   ├── dat-market.ts              # DOM parser for market sidebar
│   └── dat-detector.ts            # DAT page type detection
├── popup/
│   ├── popup.html
│   └── popup.ts                   # Mode toggles, status, bulk trigger
├── shared/
│   ├── normalizer.ts              # DAT DOM data → LoadIntelPayload
│   ├── dedup.ts                   # Client-side hash cache
│   └── api.ts                     # FleetCommand API client
└── assets/icons/
```

**Key technical decisions:**
- Manifest V3 (service worker, not background page)
- Content scripts inject into DAT pages only (matches pattern for DAT URLs)
- Client-side dedup prevents re-sending known loads within a session
- Market data scraped separately and POSTed to `/api/v1/market-data`
- Selector fallback chains: primary selector → fallback 1 → fallback 2 → give up and warn
- No commodity extraction (DAT doesn't show it on listings)
- Auth token stored in extension storage, passed with API requests

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.8.2 DAT Chrome Extension (3 modes) | 464-493 |
| `docs/tdd.md` | Extension directory structure | 242-258 |

## Screenshots

None specific to the extension.

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 464-493 (DAT Chrome Extension — 3 modes). TDD has extension directory structure at lines 242-258. Depends on load-intelligence API (ingestion endpoint must exist). Generate stories for: manifest + service worker, DAT scraper with selector fallbacks, market scraper, auto-capture mode, bulk multi-tab, normalizer + dedup, popup UI.

## Dependencies

- **load-intelligence** — Ingestion API endpoints must exist (`POST /api/v1/load-intel/ingest`, `POST /api/v1/load-intel/ingest/batch`, `POST /api/v1/market-data`)
