# FleetCommand Build Guide — Operator Runbook

> Step-by-step commands to build the FleetCommand MVP using the MACHO workflow.
> Make your workflow code adjustments first, then follow this in order.

---

## Pre-Requisites

### 1. Initialize Git

The fleet-command directory is not a git repo. MACHO requires git.

```bash
cd /Users/jr/Development/hustle-app/fleet-command
git init
git add -A
git commit -m "chore: initial commit — scaffolded UI packages + documentation"
```

### 2. Verify Directory Structure

You should have:
```
fleet-command/
  hussle-app-dispatch-api/   # Express + Prisma backend (CLAUDE.md only, no source yet)
  hussle-app-dispatch-ui/    # React + Vite + MUI frontend (scaffolded with Redux/Saga)
  mocho-ui/                  # Component library (built)
  docs/                      # PRD, TDD, screenshots, playbook
  docker-compose.yml
  package.json               # Workspace root
```

### 3. Open Claude Code in fleet-command

```bash
cd /Users/jr/Development/hustle-app/fleet-command
claude
```

All commands below run inside Claude Code.

---

## Phase 0: Bootstrap + Plan All Features

### Step 1: Bootstrap

```
/bootstrap
```

What it does:
- Detects JS/TS monorepo (3 packages)
- Generates `.planning/codebase/packages.json`
- Scans each package → REGISTRY-*.md files
- Generates CONVENTIONS.md, ARCHITECTURE.md, CONCERNS.md
- Generates `.planning/config.json`

> The API package has no source code yet — the scanner will produce a minimal registry. That's fine.

### Step 2: Configure for Speed

After bootstrap, edit `.planning/config.json`:

```json
{
  "workflow": {
    "pauseAfterWaves": [],
    "autoCreateBranch": false,
    "ceremonyCommits": true,
    "fixLoopLimit": 2
  },
  "gates": {
    "confirmStories": true,
    "confirmContract": true,
    "pauseBetweenWaves": false,
    "confirmReview": false,
    "securityReview": false,
    "runPerfTests": false,
    "runValidation": true
  }
}
```

**You review:** Story tables (after `/prd-refine`) and API contracts (after `/contract-freeze`).
**Auto-accepted:** Wave transitions, code review verdicts, fix loop decisions.

### Step 3: Init All 9 Features

Run these one at a time (each takes seconds):

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

### Step 4: Pre-Populate Feature PRDs

For each feature, tell Claude to copy the relevant PRD/TDD sections into `.planning/features/<key>/PRD.md`. Use these prompts:

**foundation:**
> Pre-populate the PRD.md for `foundation` using docs/prd.md lines 55-94, 95-126, 809-877, 925-987, 950-976 and docs/tdd.md lines 72-258, 262-842, 846-1006, 1010-1070, 1074-1105, 1109-1148, 1152-1335

**fleet-management:**
> Pre-populate the PRD.md for `fleet-management` using docs/prd.md lines 355-400, 688-738 and docs/tdd.md lines 274-498, 1074-1105, 1413-1447

**place-management:**
> Pre-populate the PRD.md for `place-management` using docs/prd.md lines 764-806 and docs/tdd.md lines 631-668, 1436-1442

**load-management:**
> Pre-populate the PRD.md for `load-management` using docs/prd.md lines 129-322, 809-877 and docs/tdd.md lines 505-731, 1010-1070, 1396-1412

**documents-bol:**
> Pre-populate the PRD.md for `documents-bol` using docs/prd.md lines 323-354, 879-895, 934-948 and docs/tdd.md lines 783-821, 1443-1447

**invoicing:**
> Pre-populate the PRD.md for `invoicing` using docs/prd.md lines 401-431, 897-924 and docs/tdd.md lines 733-781, 1449-1465

**dashboard:**
> Pre-populate the PRD.md for `dashboard` using docs/prd.md lines 740-763 and docs/tdd.md lines 1496-1500

**load-intelligence:**
> Pre-populate the PRD.md for `load-intelligence` using docs/prd.md lines 433-687 and docs/tdd.md lines 846-1006, 1152-1392, 1467-1504

**chrome-extension:**
> Pre-populate the PRD.md for `chrome-extension` using docs/prd.md lines 464-493 and docs/tdd.md lines 242-258

### Step 5: Refine All Features

For each feature, run `/prd-refine <key>` and paste the conversation starter below.

```
/prd-refine foundation
```
> This feature's requirements are defined in docs/prd.md lines 55-94 (Business Model), 95-126 (Roles), 809-877 (State Machine), 925-987 (Sequences/Pagination/Presigned URLs), 950-976 (Error Handling). The TDD at docs/tdd.md has the complete Prisma schema (lines 262-842), Redis data structures (846-1006), state machine implementation (1010-1070), onboarding gate (1074-1105), financial calculations (1109-1148), and all scoring utilities (1152-1335). This is backend-only — no UI. Generate stories for: schema + migration, shared utilities, Redis/S3/geo config, scoring utils, constants, error handling, auth middleware, seed script.

```
/prd-refine fleet-management
```
> Requirements in docs/prd.md lines 355-400 (Carrier Onboarding) and 688-738 (Fleet & Carrier Management). TDD has models at lines 274-498 and endpoints at 1413-1447. Screenshots in docs/screenshots/: carrier_details.png, carrier_onboarding.png, carrier_onboarding_details.png, driver_details.png. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Generate BE stories for carriers/drivers/vehicles/contacts CRUD + onboarding gate, FE stories for list/detail pages.

```
/prd-refine place-management
```
> Requirements in docs/prd.md lines 764-806 (Place Management). TDD has Place model at lines 631-668 and endpoints at 1436-1442. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Generate BE stories for places CRUD + typeahead + geo auto-lookup, FE stories for list/detail/form pages + reusable PlaceTypeahead component.

```
/prd-refine load-management
```
> Requirements in docs/prd.md lines 129-322 (Dispatch Board, Load Creator, Load Detail, Broker Rate Con) and 809-877 (State Machine). TDD has models at lines 505-731, state machine at 1010-1070, endpoints at 1396-1412. Screenshots: dispatch_board.png, dispatch_board_kanban.png, dispatch_board_table.png, create_load.png, load_details.png. This feature depends on fleet-management and place-management. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Max 12 stories. Generate BE stories for load CRUD + state machine + side effects + check calls, FE stories for dispatch board (Kanban + table) + load creator stepper + load detail page.

```
/prd-refine documents-bol
```
> Requirements in docs/prd.md lines 323-354 (BOL Workflow), 879-895 (Document Types), 934-948 (Presigned URL flow). TDD has Document model at lines 783-821 and endpoints at 1443-1447. Depends on load-management. Generate BE stories for document presign/confirm/list + BOL workflow + rate con handling, FE stories for upload component + BOL prompts + document list.

```
/prd-refine invoicing
```
> Requirements in docs/prd.md lines 401-431 (Invoice Manager) and 897-924 (Email Specs). TDD has Invoice model at lines 733-781 and endpoints at 1449-1465. Depends on load-management + documents-bol. Generate BE stories for invoice auto-generation + approval + PDF + SES email + payment tracking, FE stories for invoice list + detail + PDF template + approval queue.

```
/prd-refine dashboard
```
> Requirements in docs/prd.md lines 740-763 (Dashboard). TDD endpoints at 1496-1500. Screenshot: dashboard.png. Depends on load-management + invoicing. Generate BE stories for KPIs + weekly gross + attention items endpoints, FE stories for dashboard page + chart + attention section.

```
/prd-refine load-intelligence
```
> Requirements in docs/prd.md lines 433-687 (Load Intelligence Feed — all subsections). TDD has Redis structures at lines 846-1006, intelligence engine at 1152-1392, endpoints at 1467-1504. Screenshot: load_intelligence.png. Depends on foundation + fleet-management. Max 12 stories. Generate BE stories for ingestion API + scoring + market data + backhaul search + chain assembly + book load/chain, FE stories for feed page + intel card + manual entry + truck breakdown.

```
/prd-refine chrome-extension
```
> Requirements in docs/prd.md lines 464-493 (DAT Chrome Extension — 3 modes). TDD has extension directory structure at lines 242-258. Depends on load-intelligence API (ingestion endpoint must exist). Generate stories for: manifest + service worker, DAT scraper with selector fallbacks, market scraper, auto-capture mode, bulk multi-tab, normalizer + dedup, popup UI.

### Step 6: Freeze Contracts

Run `/contract-freeze` for features that have API endpoints. Answer design questions from the PRD/TDD.

```
/contract-freeze fleet-management
/contract-freeze place-management
/contract-freeze load-management
/contract-freeze documents-bol
/contract-freeze invoicing
/contract-freeze dashboard
/contract-freeze load-intelligence
```

> **Skip:** `foundation` (no API — backend utils only) and `chrome-extension` (browser extension, no API contract).

---

## Phase A: Build Foundation (~50 min)

```
/build foundation
```

Builds: Prisma schema (15+ models), shared utilities, Redis/S3 config, error classes, scoring utils, seed script.

**Wait for completion before proceeding.**

---

## Phase B: Core CRUD (~90 min)

Can run in **parallel sessions** (both depend only on foundation):

**Session 1:**
```
/build fleet-management
```
Builds: Carriers/Drivers/Vehicles/Contacts CRUD (BE + FE), onboarding gate, list/detail pages.

**Session 2:**
```
/build place-management
```
Builds: Places CRUD, typeahead API, geo auto-lookup, PlaceTypeahead component.

**Wait for both to finish.**

---

## Phase C: Load Core (~120 min)

Can run in **parallel sessions**:

**Session 1:**
```
/build load-management
```
Builds: Load CRUD, 13-status state machine, dispatch board (Kanban + table), load creator (4-step form), load detail page. **Largest feature.**

**Session 2:**
```
/build load-intelligence
```
Builds: Ingestion API, scoring engine, backhaul search, chain assembly, feed page, intel cards. Depends on foundation + fleet-management.

**Wait for both to finish.**

---

## Phase D: Operations Layer (~90 min)

Can run in **parallel sessions** with one caveat:

**Session 1 (start first):**
```
/build documents-bol
```
Builds: Document upload flow, BOL workflow, rate con handling.

**Session 2 (start after documents-bol, or accept that it may block on dependency):**
```
/build invoicing
```
Builds: Invoice auto-generation, PDF, email, payment tracking. Depends on load-management + documents-bol.

**Session 3 (independent, start anytime in this phase):**
```
/build dashboard
```
Builds: KPI endpoints, dashboard page, charts.

---

## Phase E: Extension (~45 min)

```
/build chrome-extension
```

Builds: Manifest V3, DAT scrapers, auto-capture, popup UI.

---

## Verification

### Per-Feature Verification

Run in build order:

```
/verify-feature foundation
/verify-feature fleet-management
/verify-feature place-management
/verify-feature load-management
/verify-feature load-intelligence
/verify-feature documents-bol
/verify-feature invoicing
/verify-feature dashboard
/verify-feature chrome-extension
```

### Integration Smoke Test

```bash
# 1. Start all services
docker compose up

# 2. Verify
#    - API starts, migrations run, seed completes
#    - Login → dispatch board → create load → status transitions → invoice → dashboard
#    - Fleet: create carrier → add driver → add vehicle
#    - Intel: manual entry → scoring → book load
#    - Lint + typecheck + test across all packages
npm run lint && npm run typecheck && npm run test
```

Full 17-step smoke test checklist is in `docs/prd-split-playbook.md` → "Verification Checklist".

---

## Directory Mapping Reference

| TDD Reference | Actual Directory |
|---------------|-----------------|
| `packages/api/` | `hussle-app-dispatch-api/` |
| `packages/web/` | `hussle-app-dispatch-ui/` |
| `packages/shared/` | `mocho-ui/` (partial) |
| `extension/` | Created during chrome-extension feature |

---

## Key Files

| File | Purpose |
|------|---------|
| `docs/prd.md` | Master PRD (~1,100 lines) |
| `docs/tdd.md` | Master TDD (~1,600 lines) |
| `docs/prd-split-playbook.md` | Feature breakdown, line ranges, conversation starters, verification checklist |
| `.planning/config.json` | Workflow speed settings |
| `.planning/features/<key>/PRD.md` | Per-feature PRD |

---

## Dependency Graph

```
                    foundation
                        |
              +---------+---------+
              v                   v
      fleet-management    place-management
              |    +------+
              |    |      +---------------------------+
              v    v                                  v
        load-management                     load-intelligence
          |         |                                 |
          v         |                                 v
    documents-bol   |                        chrome-extension
          |         |
          v         v
      invoicing   dashboard
```

---

## Estimated Timeline

| Phase | Features | Time |
|-------|----------|------|
| Phase 0 | Bootstrap + plan all 9 | ~45 min |
| Phase A | foundation | ~50 min |
| Phase B | fleet-management, place-management | ~90 min (parallel) |
| Phase C | load-management, load-intelligence | ~120 min (parallel) |
| Phase D | documents-bol, invoicing, dashboard | ~90 min (parallel) |
| Phase E | chrome-extension | ~45 min |
| Verify | All features | ~60 min |
| **Total** | | **~8-10 hrs (single) / ~5-6 hrs (parallel)** |
