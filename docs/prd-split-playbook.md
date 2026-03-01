# FleetCommand PRD Split Playbook

> Step-by-step guide to splitting the FleetCommand MVP's master PRD/TDD into 9 feature-scoped PRDs and building them with the MACHO workflow.

## Why This Exists

The master PRD (`docs/prd.md`) is ~1,100 lines and the TDD (`docs/tdd.md`) is ~1,600 lines. Together they describe a full trucking dispatch management system. The MACHO workflow expects features with 5-12 stories each (2-5 files per story). Building from the monolithic PRD would generate 80+ stories — far beyond a single feature's scope.

This playbook splits the monolith into 9 features, maps each to its source PRD/TDD sections, and provides the exact execution sequence.

**Key insight:** The workflow's `/prd-refine` command loads `.planning/features/<key>/PRD.md` as its starting template. By pre-populating each feature's PRD.md with the relevant master PRD sections, the conversational refinement becomes a quick confirmation pass instead of starting from scratch.

---

## Table of Contents

- [Feature Breakdown](#feature-breakdown)
- [Build Order & Dependency Graph](#build-order--dependency-graph)
- [Execution Steps](#execution-steps)
- [Speed Configuration](#speed-configuration)
- [Structure Mapping](#structure-mapping)
- [Screenshot-to-Feature Mapping](#screenshot-to-feature-mapping)
- [PRD-Refine Conversation Starters](#prd-refine-conversation-starters)
- [Risk Areas & Mitigations](#risk-areas--mitigations)
- [Verification Checklist](#verification-checklist)

---

## Feature Breakdown

### Feature 1: `foundation` (8-10 stories)

**PRD sections (docs/prd.md):**
| Section | Lines |
|---------|-------|
| S2 Business Model | 55-94 |
| S3 Roles | 95-126 |
| S5 State Machine | 809-877 |
| S8 Sequences, S9 Presigned URLs | 925-948 |
| S10 Error Handling | 950-976 |
| S11 Pagination | 978-987 |

**TDD sections (docs/tdd.md):**
| Section | Lines |
|---------|-------|
| S2 Project Structure | 72-258 |
| S3 Prisma Schema (ALL models) | 262-842 |
| S4 Redis Data Structures | 846-1006 |
| S5 State Machine impl | 1010-1070 |
| S6 Onboarding Gate | 1074-1105 |
| S7 Financials | 1109-1148 |
| S8 Scoring utilities | 1152-1272 |
| S8.5 Geo Utilities | 1312-1335 |

**Scope:**
- Prisma schema with all 15+ models and enums
- Shared utilities: financials (Decimal.js), state machine, pagination, sequence generator
- Scoring utilities: minBookRate, compositeScore, driverFit, chainScore, CPM
- Redis client, S3 presign utility, geo lookup + haversine
- Geo bootstrap script (CSV → Redis), env/database/redis/s3 config
- Onboarding gate, shared constants (enums, kanban groups, equipment types, roles)
- Error classes, response envelope, auth middleware integration
- Seed script (carriers, drivers, vehicles, contacts, org settings)

**Backend only — no UI.**

---

### Feature 2: `fleet-management` (10 stories)

**PRD sections (docs/prd.md):**
| Section | Lines |
|---------|-------|
| S4.6 Carrier Onboarding | 355-400 |
| S4.9 Fleet & Carrier Management | 688-738 |

**TDD sections (docs/tdd.md):**
| Section | Lines |
|---------|-------|
| Carrier, Driver, Vehicle, Contact models | 274-498 |
| S6 Onboarding Gate | 1074-1105 |
| P0 Carriers/Drivers/Vehicles/Contacts endpoints | 1413-1447 |

**Screenshots:** `carrier_details.png`, `carrier_onboarding.png`, `carrier_onboarding_details.png`, `driver_details.png`

**Scope:**
- Carriers CRUD + onboarding fields + dispatch agreement handling
- Drivers CRUD + preferences (lanes, no-go zones, home base, max days out)
- Vehicles CRUD + CPM expense editor
- Contacts CRUD
- Onboarding gate enforcement on load assignment
- Carrier list/detail pages, driver detail with preferences editor, vehicle detail with CPM editor

---

### Feature 3: `place-management` (7 stories)

**PRD sections (docs/prd.md):**
| Section | Lines |
|---------|-------|
| S4.11 Place Management | 764-806 |

**TDD sections (docs/tdd.md):**
| Section | Lines |
|---------|-------|
| Place model | 631-668 |
| P0 Places endpoints | 1436-1442 |

**Scope:**
- Places CRUD with facility intelligence fields
- Typeahead API (search by name/city/state, min 2 chars)
- Geo auto-lookup from Redis city centroids on save
- Place list page, detail page, create/edit form (3 sections)
- PlaceTypeahead reusable component (used later by load creator)

---

### Feature 4: `load-management` (12 stories — at the limit)

**PRD sections (docs/prd.md):**
| Section | Lines |
|---------|-------|
| S4.1 Dispatch Board | 129-183 |
| S4.2 Load Creator | 184-257 |
| S4.3 Load Detail | 258-287 |
| S4.4 Broker Rate Con | 288-322 |
| S5 State Machine (transitions/side effects only) | 809-877 |

**TDD sections (docs/tdd.md):**
| Section | Lines |
|---------|-------|
| Load + Stop + LoadStatusHistory + CheckCall + AccessorialCharge models | 505-731 |
| S5 State Machine impl | 1010-1070 |
| P0 Load endpoints | 1396-1412 |

**Screenshots:** `dispatch_board.png`, `dispatch_board_kanban.png`, `dispatch_board_table.png`, `create_load.png`, `load_details.png`

**Scope:**
- Load CRUD with 13-status state machine + transition prerequisites/warnings/side effects
- Multi-step load creator (4 steps) with PlaceTypeahead, carrier/driver/vehicle assignment
- Driver fit warnings (no-go zones, preferred lanes, days from home)
- Dispatch board: 6-column Kanban + table view with sort/filter/search
- Weekly gross tracker per truck
- Load detail page (all sections)
- Status change dialog, check calls, status history
- Broker rate con upload + tracking

---

### Feature 5: `documents-bol` (8 stories)

**PRD sections (docs/prd.md):**
| Section | Lines |
|---------|-------|
| S4.5 BOL Workflow | 323-354 |
| S6 Document Types | 879-895 |
| S9 Presigned URL flow | 934-948 |

**TDD sections (docs/tdd.md):**
| Section | Lines |
|---------|-------|
| Document model + DocumentType enum | 783-821 |
| P0 Documents endpoints | 1443-1447 |

**Scope:**
- Document module: presigned URL upload, confirm, list
- BOL two-stage workflow (unsigned at pickup, signed at delivery)
- Broker rate con document handling (rateConReceivedAt, archive)
- DocumentUpload shared component
- BolWorkflow component (prompts at AT_PICKUP and DELIVERED)
- Document list on load detail and carrier detail

---

### Feature 6: `invoicing` (10 stories)

**PRD sections (docs/prd.md):**
| Section | Lines |
|---------|-------|
| S4.7 Invoice Manager | 401-431 |
| S7 Email Specifications | 897-924 |

**TDD sections (docs/tdd.md):**
| Section | Lines |
|---------|-------|
| Invoice model + InvoiceType + InvoiceStatus enums | 733-781 |
| P1 Invoice endpoints | 1449-1465 |

**Scope:**
- Invoice auto-generation on DELIVERED (CUSTOMER vs DISPATCH_FEE types)
- Invoice approval, PDF generation (@react-pdf), upload to S3
- SES email send with 3-attempt retry
- Payment tracking (mark paid, partial, methods)
- Email service (SES config, invoice + dispatch agreement templates)
- Invoice list page with filters, detail page, approval queue
- InvoicePdfTemplate component

---

### Feature 7: `dashboard` (6 stories)

**PRD sections (docs/prd.md):**
| Section | Lines |
|---------|-------|
| S4.10 Dashboard | 740-763 |

**TDD sections (docs/tdd.md):**
| Section | Lines |
|---------|-------|
| P2 Dashboard endpoints | 1496-1500 |

**Screenshots:** `dashboard.png`

**Scope:**
- Dashboard KPIs endpoint (load counts, revenue, fees, overdue)
- Weekly gross per truck endpoint + attention items
- Dashboard page with KPI cards, bar chart, attention items section

---

### Feature 8: `load-intelligence` (12 stories — at the limit)

**PRD sections (docs/prd.md):**
| Section | Lines |
|---------|-------|
| S4.8 — ALL subsections (Architecture, Sources, Min Book Rate, Market Strength, Scoring, Chaining, Feed Display, Book Chain Flow) | 433-687 |

**TDD sections (docs/tdd.md):**
| Section | Lines |
|---------|-------|
| S4 Redis Data Structures (shared with foundation) | 846-1006 |
| S8 Intelligence Engine (all) | 1152-1392 |
| P2 Load Intel + Market + Backhaul + Fleet endpoints | 1467-1504 |

**Screenshots:** `load_intelligence.png`

**Scope:**
- Source-agnostic ingestion API (single + batch)
- Dedup via Redis hash, normalize payload
- Composite scoring per truck (CPM + market + driver fit)
- Min book rate calculation, market data storage
- Backhaul search (50mi radius), chain assembly + scoring
- Book load / book chain endpoints (copy to Load Creator)
- Manual entry form
- Feed page with side-by-side single + chain cards
- IntelCard, TruckBreakdownTable, source badges, filters/sort

---

### Feature 9: `chrome-extension` (8 stories)

**PRD sections (docs/prd.md):**
| Section | Lines |
|---------|-------|
| S4.8.2 DAT Chrome Extension (3 modes) | 464-493 |

**TDD sections (docs/tdd.md):**
| Section | Lines |
|---------|-------|
| `extension/` directory structure | 242-258 |

**Scope:**
- Manifest V3, service worker, API client
- DAT scraper: DOM parser for load results with selector fallback chains
- DAT market scraper: load-to-truck ratio from sidebar
- Auto-capture mode (silent scraping, 30s batching)
- Bulk multi-tab mode
- Normalizer: DAT DOM → LoadIntelPayload, client-side dedup
- Popup UI: mode toggles, status display, batch results

---

## Build Order & Dependency Graph

```
                    ┌─────────────┐
                    │  foundation  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ fleet-management │    │ place-management  │
    └────────┬─────────┘    └────────┬──────────┘
             │    ┌──────────────────┘
             │    │    ┌─────────────────────────────┐
             ▼    ▼    │                             │
    ┌──────────────────┤              ┌──────────────┴──────┐
    │ load-management  │              │ load-intelligence    │
    └───┬──────┬───────┘              └──────────┬──────────┘
        │      │                                 │
        ▼      │                                 ▼
  ┌───────────────┐  │              ┌────────────────────┐
  │ documents-bol │  │              │ chrome-extension    │
  └───────┬───────┘  │              └────────────────────┘
          │          │
          ▼          ▼
    ┌──────────┐  ┌───────────┐
    │ invoicing│  │ dashboard │
    └──────────┘  └───────────┘
```

### Phase Breakdown

| Phase | Features | Dependencies | Est. Time |
|-------|----------|-------------|-----------|
| **Phase 0** | Plan all 9 features | None | 45 min |
| **Phase A** | `foundation` | None | 50 min |
| **Phase B** | `fleet-management`, `place-management` | foundation | 90 min (parallel) |
| **Phase C** | `load-management`, `load-intelligence` | fleet + place (loads), foundation + fleet (intel) | 120 min (parallel) |
| **Phase D** | `documents-bol`, `invoicing`, `dashboard` | load-management | 90 min (parallel) |
| **Phase E** | `chrome-extension` | load-intelligence API | 45 min |
| **Integration** | Verify all features | All | 60 min |

**Total:** ~8-10 hours single-operator, ~5-6 hours with parallel sessions.

---

## Execution Steps

### Step 1: Bootstrap

Run in the fleet-command repo root:

```
/bootstrap
```

This generates:
- `packages.json` — maps hussle-app-dispatch-api, hussle-app-dispatch-ui, mocho-ui
- Registry files per package
- `CONVENTIONS.md`, `ARCHITECTURE.md`

### Step 2: Configure for Speed

Create or update `.planning/config.json`:

```json
{
  "workflow": {
    "pauseBetweenWaves": false,
    "autoCreateBranch": false,
    "ceremonyCommits": true,
    "fixLoopLimit": 2
  },
  "gates": {
    "confirmStories": false,
    "pauseBetweenWaves": false,
    "confirmReview": false,
    "securityReview": false,
    "runPerfTests": false,
    "runValidation": true
  }
}
```

**What this does:**
- Disables all confirmation gates except validation — Claude builds without pausing
- Keeps ceremony commits for traceability
- Limits fix loops to 2 attempts before moving on
- Disables branch auto-creation (you control branching)

### Step 3: Initialize All Features

Run `/feature-init` for each of the 9 features. This creates the `.planning/features/<key>/` directory structure.

```
/feature-init foundation
/feature-init fleet-management
/feature-init place-management
/feature-init load-management
/feature-init documents-bol
/feature-init invoicing
/feature-init dashboard
/feature-init load-intelligence
/feature-init chrome-extension
```

After each init, the workflow creates `.planning/features/<key>/PRD.md` as a blank or minimal template.

### Step 4: Pre-Populate Feature PRDs

For each feature, copy the relevant sections from `docs/prd.md` and `docs/tdd.md` into `.planning/features/<key>/PRD.md`. Use the line ranges from the [Feature Breakdown](#feature-breakdown) section above.

This is the critical step — pre-populating means `/prd-refine` starts with real requirements instead of a blank canvas.

### Step 5: Refine Each Feature

Run `/prd-refine` for each feature. Since the PRD.md is pre-populated, use the [conversation starters](#prd-refine-conversation-starters) below to fast-track the refinement.

### Step 6: Freeze Contracts

Run `/contract-freeze` for each feature. The TDD Section 9 API endpoint specs serve as the contract source.

### Step 7: Build in Dependency Order

Follow the phase order strictly:

```bash
# Phase A
/build foundation

# Phase B (can run in parallel sessions)
/build fleet-management
/build place-management

# Phase C (can run in parallel sessions)
/build load-management
/build load-intelligence

# Phase D (can run in parallel sessions)
/build documents-bol
/build invoicing
/build dashboard

# Phase E
/build chrome-extension
```

### Step 8: Verify

Run `/verify-feature` on each feature in build order.

---

## Structure Mapping

The TDD references generic package names. Map them to actual directories:

| TDD Reference | Actual Directory | Notes |
|---------------|-----------------|-------|
| `packages/api/` | `hussle-app-dispatch-api/` | Express + Prisma backend |
| `packages/web/` | `hussle-app-dispatch-ui/` | React + Vite + MUI frontend |
| `packages/shared/` | `mocho-ui/` (partial) | Component library; shared types/utils may need a new shared package or go in api |
| `extension/` | TBD — create during chrome-extension feature | Chrome Extension (Manifest V3) |

**Action:** During `/prd-refine` for each feature, update all TDD directory references to the actual directory names above.

---

## Screenshot-to-Feature Mapping

These screenshots in `docs/screenshots/` can be referenced during `/design` or `/prd-refine`:

| Screenshot | Feature |
|-----------|---------|
| `dispatch_board.png` | load-management |
| `dispatch_board_kanban.png` | load-management |
| `dispatch_board_table.png` | load-management |
| `create_load.png` | load-management |
| `load_details.png` | load-management |
| `carrier_details.png` | fleet-management |
| `carrier_onboarding.png` | fleet-management |
| `carrier_onboarding_details.png` | fleet-management |
| `driver_details.png` | fleet-management |
| `dashboard.png` | dashboard |
| `load_intelligence.png` | load-intelligence |

---

## PRD-Refine Conversation Starters

Paste these when `/prd-refine` starts for each feature to skip the exploratory conversation:

### foundation

> "This feature's requirements are defined in docs/prd.md lines 55-94 (Business Model), 95-126 (Roles), 809-877 (State Machine), 925-987 (Sequences/Pagination/Presigned URLs), 950-976 (Error Handling). The TDD at docs/tdd.md has the complete Prisma schema (lines 262-842), Redis data structures (846-1006), state machine implementation (1010-1070), onboarding gate (1074-1105), financial calculations (1109-1148), and all scoring utilities (1152-1335). This is backend-only — no UI. Generate stories for: schema + migration, shared utilities, Redis/S3/geo config, scoring utils, constants, error handling, auth middleware, seed script."

### fleet-management

> "Requirements in docs/prd.md lines 355-400 (Carrier Onboarding) and 688-738 (Fleet & Carrier Management). TDD has models at lines 274-498 and endpoints at 1413-1447. Screenshots in docs/screenshots/: carrier_details.png, carrier_onboarding.png, carrier_onboarding_details.png, driver_details.png. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Generate BE stories for carriers/drivers/vehicles/contacts CRUD + onboarding gate, FE stories for list/detail pages."

### place-management

> "Requirements in docs/prd.md lines 764-806 (Place Management). TDD has Place model at lines 631-668 and endpoints at 1436-1442. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Generate BE stories for places CRUD + typeahead + geo auto-lookup, FE stories for list/detail/form pages + reusable PlaceTypeahead component."

### load-management

> "Requirements in docs/prd.md lines 129-322 (Dispatch Board, Load Creator, Load Detail, Broker Rate Con) and 809-877 (State Machine). TDD has models at lines 505-731, state machine at 1010-1070, endpoints at 1396-1412. Screenshots: dispatch_board.png, dispatch_board_kanban.png, dispatch_board_table.png, create_load.png, load_details.png. This feature depends on fleet-management and place-management. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Max 12 stories. Generate BE stories for load CRUD + state machine + side effects + check calls, FE stories for dispatch board (Kanban + table) + load creator stepper + load detail page."

### documents-bol

> "Requirements in docs/prd.md lines 323-354 (BOL Workflow), 879-895 (Document Types), 934-948 (Presigned URL flow). TDD has Document model at lines 783-821 and endpoints at 1443-1447. Depends on load-management. Generate BE stories for document presign/confirm/list + BOL workflow + rate con handling, FE stories for upload component + BOL prompts + document list."

### invoicing

> "Requirements in docs/prd.md lines 401-431 (Invoice Manager) and 897-924 (Email Specs). TDD has Invoice model at lines 733-781 and endpoints at 1449-1465. Depends on load-management + documents-bol. Generate BE stories for invoice auto-generation + approval + PDF + SES email + payment tracking, FE stories for invoice list + detail + PDF template + approval queue."

### dashboard

> "Requirements in docs/prd.md lines 740-763 (Dashboard). TDD endpoints at 1496-1500. Screenshot: dashboard.png. Depends on load-management + invoicing. Generate BE stories for KPIs + weekly gross + attention items endpoints, FE stories for dashboard page + chart + attention section."

### load-intelligence

> "Requirements in docs/prd.md lines 433-687 (Load Intelligence Feed — all subsections). TDD has Redis structures at lines 846-1006, intelligence engine at 1152-1392, endpoints at 1467-1504. Screenshot: load_intelligence.png. Depends on foundation + fleet-management. Max 12 stories. Generate BE stories for ingestion API + scoring + market data + backhaul search + chain assembly + book load/chain, FE stories for feed page + intel card + manual entry + truck breakdown."

### chrome-extension

> "Requirements in docs/prd.md lines 464-493 (DAT Chrome Extension — 3 modes). TDD has extension directory structure at lines 242-258. Depends on load-intelligence API (ingestion endpoint must exist). Generate stories for: manifest + service worker, DAT scraper with selector fallbacks, market scraper, auto-capture mode, bulk multi-tab, normalizer + dedup, popup UI."

---

## Risk Areas & Mitigations

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | **Foundation schema** — 15+ models with complex relations. If migration fails, everything is blocked. | Blocks all features | TDD has the complete schema ready; review carefully before running migration |
| 2 | **Load state machine side effects** — DELIVERED → INVOICE_PENDING auto-transition crosses module boundaries. | Invoice feature coupling | Use domain events; stub invoice handler initially in load-management |
| 3 | **Load creator form** — Most complex UI component (4 steps, integrates everything). | Longest single story | mocho-ui has StepperForm and DynamicForm already; lean on existing components |
| 4 | **Chrome extension DOM selectors** — DAT's DOM is undocumented. | Selectors break on DAT updates | Accept selectors are provisional; build normalizer + API integration solid so scraper is replaceable |
| 5 | **Contract doesn't exist yet** — The `/contract-freeze` step will generate it. | Delayed start to builds | The TDD Section 9 endpoint specs serve as the contract source material |

---

## Verification Checklist

After all features are built, run through this checklist:

### Per-Feature Verification

- [ ] `/verify-feature foundation` — schema, utilities, seed data
- [ ] `/verify-feature fleet-management` — CRUD, onboarding gate
- [ ] `/verify-feature place-management` — CRUD, typeahead, geo lookup
- [ ] `/verify-feature load-management` — state machine, dispatch board, load creator
- [ ] `/verify-feature documents-bol` — upload flow, BOL workflow
- [ ] `/verify-feature invoicing` — auto-generation, PDF, email
- [ ] `/verify-feature dashboard` — KPIs, charts
- [ ] `/verify-feature load-intelligence` — ingestion, scoring, chaining
- [ ] `/verify-feature chrome-extension` — scraping, batching, popup

### Integration Verification

- [ ] Docker compose up — API starts, migrations run, seed completes
- [ ] Login → dispatch board → create load → load detail → status transitions → delivery → invoice
- [ ] Fleet management: create carrier → add driver with preferences → add vehicle with expenses
- [ ] Intelligence: manual entry → scoring appears → book load → verify load created
- [ ] Full validation: lint + typecheck + build across all packages

### Smoke Test Flow

1. Start all services (`docker compose up`)
2. Verify API health check responds
3. Verify migrations applied cleanly
4. Verify seed data populated
5. Log in as dispatcher
6. Create a carrier → complete onboarding
7. Add a driver with lane preferences
8. Add a vehicle with expense data
9. Create a place (shipper)
10. Create a load (full 4-step flow)
11. Transition load through: POSTED → DISPATCHED → AT_PICKUP → IN_TRANSIT → AT_DELIVERY → DELIVERED
12. Upload BOL at pickup, signed BOL at delivery
13. Verify invoice auto-generated on DELIVERED
14. Approve invoice, verify PDF generated
15. Check dashboard KPIs reflect the load
16. Submit a manual intel load → verify scoring
17. Book an intel load → verify load created in dispatch board
