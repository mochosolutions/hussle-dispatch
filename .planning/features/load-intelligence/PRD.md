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

# PRD — Load Intelligence

| Field | Value |
|-------|-------|
| Feature Key | load-intelligence |
| Created | 2026-03-01 |
| Phase | INTAKE |

## Summary

Source-agnostic intelligence engine that ingests loads from any source (DAT extension, manual entry), deduplicates via Redis hash, scores them per truck across profitability + market + driver fit, chains them into round trips with three optimization metrics, and provides a feed UI with side-by-side single + chain scoring, filters, book/dismiss actions, and per-truck breakdown.

## Scope

**Does:**
- Source-agnostic ingestion API: single + batch, validates, normalizes, dedupes, scores, stores in Redis (24h TTL)
- Deduplication via SHA256 hash (source-aware): `SHA256(source + origin + dest + pickup + broker_mc + rate).slice(0, 12)`
- Per-truck composite scoring (0-100): CPM Profitability (0-40) + Destination Market (0-30) + Driver Fit (0-30). Two modes: full (★, rate available) and route (◇, no rate)
- Min book rate calculation per truck, shown on all loads as negotiation reference
- Destination market strength from DAT (load-to-truck ratio), stored in Redis with 6h TTL
- Backhaul search: loads originating within 50mi of outbound destination, filtered by date/equipment, capped at 20
- Chain assembly: 2-step (< 500mi from home) or 3-step (≥ 500mi). Three metrics: Round-Trip Profitability, Daily Revenue Utilization, Weekly Gross Projection
- Chain scoring (0-100): Chain Profitability (0-40) + Return Positioning (0-35) + Time Efficiency (0-25)
- "Book This Load" → pre-fills Load Creator with best truck/driver, min book rate helper
- "Book Chain" → pre-fills outbound + saves backhaul as planned reference on load record
- Manual entry form (simplified modal)
- Feed page with side-by-side single + chain cards, source badges, stats header, filters/sort, per-truck breakdown table
- Dismiss (Redis set)

**Does NOT:**
- Scrape DAT or any external source (that's chrome-extension)
- Manage loads in Postgres (that's load-management)
- Generate invoices or handle documents

## Capabilities

1. **Ingestion API:** `POST /api/v1/load-intel/ingest` (single), `POST /api/v1/load-intel/ingest/batch` (batch for extension). Universal `LoadIntelPayload` format with source tag. Validate → normalize → dedupe → get market data → score per truck → store Redis (24h TTL) → add to feed sorted set.
2. **Scoring:** Three dimensions. CPM: $1.00+/mi profit→40pts, $0.75-0.99→35, $0.50-0.74→28, $0.25-0.49→18, $0.10-0.24→8, below→0. Market: Hot(3.0+)→30, Balanced(1.5-2.9)→22, Soft(0.8-1.4)→10, Dead(<0.8)→0, No data→15. Driver Fit: no-go→0 (🚫), preferred lane→+15, not preferred→+5, ≤200mi from home→+10, 200-500→+5, no prefs→15 neutral.
3. **Min Book Rate:** `(vehicleCPM × totalMiles) / (1 - feePercent/100) × (1 + profitMargin)`, rounded to nearest $50. Three card states: above min (green), below min (red), no price (show "Book above $X").
4. **Market Strength:** Hot (3.0+, green), Balanced (1.5-2.9, blue), Soft (0.8-1.4, yellow), Dead (<0.8, red). 6h TTL in Redis.
5. **Chaining:** Backhaul within 50mi radius, compatible equipment, pickup ≥ delivery date. 2-step or 3-step based on 500mi threshold. Chain scoring: profitability (0-40), return positioning (0-35), time efficiency (0-25). Lazy evaluation (on feed load, not ingestion).
6. **Feed UI:** Side-by-side single + chain scores. Source badges (DAT blue, Manual gray). Stats header: "142 loads from 3 sources". Filters: score tier, equipment, origin/dest, market, has rate, score type, source. Sort: score, chain score, rate, miles, pickup.
7. **Book This Load:** copies to Load Creator with best truck/driver pre-selected, min book rate as helper
8. **Book Chain:** copies outbound + saves backhaul as plannedNextLoadRef JSON on load record
9. **Manual Entry:** modal form (origin, dest, pickup, equipment, rate, miles, broker). Source='manual'.

## Success Criteria

- GIVEN a load to Charlotte (L/T=2.8) with Marcus (preferred NJ→NC) WHEN feed displays THEN Marcus's truck shows highest composite with "Preferred Lane" and min book rate, plus chain with best Charlotte→NJ backhaul
- GIVEN a load to Montana with James (MT is no-go) WHEN feed displays THEN James's truck shows "🚫 No-Go" with single score 0, no chain evaluated
- GIVEN an unpriced load to Memphis with no backhaul data WHEN feed displays THEN card shows "📞 Book above $1,200" with ◇ route score, chain panel shows "— No backhaul data" with market proxy
- GIVEN a priced load with strong 2-step chain WHEN "Book Chain" clicked THEN Load Creator opens with outbound pre-filled and Step 4 shows planned backhaul summary
- GIVEN a load booked via "Book Chain" WHEN load detail viewed 3 days later THEN planned backhaul shows "Backhaul Expired" with "Find New Backhaul" button
- GIVEN a manual load entry for NJ→NC WHEN submitted THEN load appears in feed tagged "Manual" with full scoring and chain data
- GIVEN auto-capture ON WHEN dispatcher browses 5 DAT pages THEN extension silently ingests all results into feed
- GIVEN "Bulk Scrape All Tabs" with 3 DAT tabs WHEN clicked THEN shows "3 searches, 142 loads, 98 new"

## Data Requirements

**Redis structures (defined in foundation S4, used here):**
- `intel:{orgId}:{loadHash}` — LoadIntelRedis (individual load with per-truck scores)
- `intel:feed:{orgId}` — Sorted set (feed ranked by best composite score)
- `intel:dismissed:{orgId}` — Set (dismissed load hashes)
- `intel:chain:{orgId}:{loadHash}` — ChainCacheRedis (cached chain results)
- `market:{state}:{city}` — Market strength snapshot

**TypeScript interfaces (from TDD S4):**
- `LoadIntelPayload` — universal ingestion format
- `LoadIntelRedis` — stored in Redis per load
- `TruckScore` — per-truck scoring breakdown
- `ChainCacheRedis` / `ChainResult` / `ChainLeg` — chain data

**Depends on from foundation:**
- Scoring utilities (minBookRate, compositeScore, driverFit, chainScore, CPM)
- Geo utilities (getCityCoords, haversineDistance)
- Redis client
- Error classes, auth middleware

## User Flows

**Ingest from Extension:**
1. Extension POSTs batch of LoadIntelPayloads to `/api/v1/load-intel/ingest/batch`
2. Each payload: validate → normalize → hash → dedupe check → get/store market data → score per active truck → store in Redis → add to feed
3. Result: `{ total: 50, ingested: 42, duplicates: 6, invalid: 2 }`

**Browse Feed:**
1. Dispatcher opens load intelligence page
2. Feed loads from Redis sorted set, top scores first
3. Each card shows: route, rate, min book rate indicator, market badge, single-load score, chain score
4. Expand card → per-truck breakdown table
5. Filter/sort as needed

**Book Chain:**
1. Dispatcher finds promising chain (outbound + backhaul)
2. Clicks "Book Chain"
3. Load Creator opens with outbound data pre-filled, best truck/driver selected
4. Step 4 shows planned backhaul summary
5. Creates load → backhaul saved as plannedNextLoadRef JSON
6. Later on load detail: "Planned Backhaul" section shows backhaul info, "Convert to Load" button, or "Backhaul Expired" if Redis key gone

## Affected Services

- `hussle-app-dispatch-api` — Load-intel module (routes, controller, service, scoring, chaining, backhaul, redis, manual), Market module
- `hussle-app-dispatch-ui` — LoadIntelFeed page, IntelCard, SingleScorePanel, ChainScorePanel, TruckBreakdownTable, MarketBadge, MinBookIndicator, SourceBadge, ManualEntryModal, FeedHeader

## Technical Context

**mocho-ui components:**
`PageWrapper`, `PageHeader`, `MainCard`, `Tabs`, `DataGrid`, `FormDialog`, `TextField`, `SelectField`, `Dot`, `Tooltip`, `EmptyState`, `createCrudSlice`, `createEntityModule`, `useFormRef`

**Key technical decisions:**
- All intelligence data is ephemeral in Redis (24h TTL), not Postgres
- Scoring happens at ingestion time (per-truck), chaining is lazy (on feed load/card expand)
- Chain results cached in Redis alongside load data
- "Book This Load" and "Book Chain" copy data into Postgres via load-management — intelligence data is ephemeral reference only
- Feed pagination is from Redis sorted set (ZREVRANGE with offset/limit), not Postgres
- Source-agnostic: ingestion API doesn't know or care where data comes from
- No commodity check at ingestion (DAT doesn't show commodity)

**API Endpoints:**

```
POST   /api/v1/load-intel/ingest            Single load ingestion
POST   /api/v1/load-intel/ingest/batch      Batch ingestion (extension modes)
POST   /api/v1/load-intel/manual            Simplified manual entry form
GET    /api/v1/load-intel/feed              ?page=&limit=&score=&hasRate=&equipmentType=
                                            &source=&includeChains=
GET    /api/v1/load-intel/:id               Single load with full scores
GET    /api/v1/load-intel/:id/chains        Chain options (?vehicleId=&limit=3)
POST   /api/v1/load-intel/:id/book          Copy to Load Creator
POST   /api/v1/load-intel/:id/book-chain    Copy outbound + planned backhaul
DELETE /api/v1/load-intel/:id               Dismiss

GET    /api/v1/load-intel/backhaul          ?fromCity=&fromState=&radius=&earliestPickup=

POST   /api/v1/market-data                  Store market snapshot
GET    /api/v1/market-data/:state/:city     Current market strength
```

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.8 Load Intelligence Feed (all subsections) | 433-687 |
| `docs/tdd.md` | S4 Redis Data Structures | 846-1006 |
| `docs/tdd.md` | S8 Intelligence Engine (all: min book, scoring, chaining, backhaul, geo, ingestion) | 1152-1392 |
| `docs/tdd.md` | P2 Load Intel + Market + Backhaul + Fleet endpoints | 1467-1504 |

## Screenshots

- `docs/screenshots/load_intelligence.png`

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 433-687 (Load Intelligence Feed — all subsections). TDD has Redis structures at lines 846-1006, intelligence engine at 1152-1392, endpoints at 1467-1504. Screenshot: load_intelligence.png. Depends on foundation + fleet-management. Max 12 stories. Generate BE stories for ingestion API + scoring + market data + backhaul search + chain assembly + book load/chain, FE stories for feed page + intel card + manual entry + truck breakdown.

## Dependencies

- **foundation** — Scoring utilities, geo utilities, Redis client, error classes, auth middleware
- **fleet-management** — Carrier/Driver/Vehicle data for per-truck scoring (driver preferences, vehicle CPM)
