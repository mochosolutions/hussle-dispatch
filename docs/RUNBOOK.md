# FleetCommand MACHO Workflow — Executable Runbook

> **How to use:** Open Claude Code in `/Users/jr/Development/hustle-app/fleet-command` and say:
> "Read `docs/RUNBOOK.md` and execute it step by step. After completing each numbered step, STOP and ask me to review before proceeding to the next step. Do NOT continue automatically."

## Screenshots Reference

Design screenshots originate in `docs/screenshots/` and are copied into each feature's `designs/` folder during Step 3. Agents read them from the feature-local path during `/prd-refine`, `/contract-freeze`, and `/build`.

| Screenshot | Feature → `designs/` location | Purpose |
|---|---|---|
| `carrier_details.png` | fleet-management | Carrier detail page layout + data fields |
| `carrier_onboarding.png` | fleet-management | Onboarding flow entry |
| `carrier_onboarding_details.png` | fleet-management | Onboarding form fields |
| `driver_details.png` | fleet-management | Driver detail page layout |
| `carrier_portal_blling.png` | fleet-management | Carrier portal billing — informs carrier detail |
| `carrier_portal_dashboard.png` | fleet-management | Carrier portal dashboard — informs carrier detail |
| `carrier_portal_documents.png` | fleet-management | Carrier portal documents — informs carrier detail |
| `carrier_portal_drivers_vehicles.png` | fleet-management | Carrier portal drivers/vehicles — informs fleet lists |
| `carrier_portal_load_history.png` | fleet-management | Carrier portal load history — informs carrier detail |
| `carrier_portal_prefernces.png` | fleet-management | Carrier portal preferences — informs carrier settings |
| `dispatch_board.png` | load-management | Dispatch board overview |
| `dispatch_board_kanban.png` | load-management | Kanban view with status columns |
| `dispatch_board_table.png` | load-management | Table view with sortable columns |
| `create_load.png` | load-management | Load creator stepper form |
| `load_details.png` | load-management | Load detail page layout + data fields |
| `dashboard.png` | dashboard | Dashboard KPIs, charts, attention items |
| `load_intelligence.png` | load-intelligence | Intelligence feed, cards, scoring |

---

## Step 0: Install MACHO Tools

Copy the MACHO workflow tools from the workflow-integration repo into this project's `.claude/` directory.

```bash
MACHO_SRC="/Users/jr/Development/claude-workflow/workflow-integration/macho"
TARGET=".claude"

# Create directories
mkdir -p "$TARGET/bin" "$TARGET/agents" "$TARGET/skills"

# Copy tools
cp "$MACHO_SRC/bin/macho-tools.js" "$TARGET/bin/"
cp "$MACHO_SRC/agents/"*.md "$TARGET/agents/"
cp -r "$MACHO_SRC/skills/"* "$TARGET/skills/"
cp "$MACHO_SRC/hooks/macho-statusline.js" "$TARGET/hooks/" 2>/dev/null || mkdir -p "$TARGET/hooks" && cp "$MACHO_SRC/hooks/macho-statusline.js" "$TARGET/hooks/"
```

Verify: `ls .claude/bin/macho-tools.js .claude/agents/backend-coder.md .claude/skills/bootstrap/SKILL.md` should all exist.

**>>> PAUSE — Ask user to confirm tools are installed before proceeding.**

---

## Step 1: Bootstrap

Run `/bootstrap` to scan the project and generate `.planning/`.

This produces:
- `.planning/codebase/packages.json`
- `.planning/codebase/REGISTRY-*.md` (per package)
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/config.json`
- Root `CLAUDE.md` (if not already present)

**>>> PAUSE — Show user the bootstrap report. Let them review packages.json and ARCHITECTURE.md before proceeding.**

---

## Step 2: Configure Speed Settings

Edit `.planning/config.json` to use these settings:

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
    "runValidation": true,
    "skipIntegrationTests": true
  }
}
```

**>>> PAUSE — Show user the updated config.json for confirmation.**

---

## Step 3: Initialize All 9 Features

Run `/feature-init` for each feature in this exact order:

1. `/feature-init foundation`
2. `/feature-init fleet-management`
3. `/feature-init place-management`
4. `/feature-init load-management`
5. `/feature-init documents-bol`
6. `/feature-init invoicing`
7. `/feature-init dashboard`
8. `/feature-init load-intelligence`
9. `/feature-init chrome-extension`

Verify: `ls .planning/features/` should show all 9 directories, each containing `feature.json`, `PRD.md`, `DECISIONS.md`, and `stories/` subdirectory.

After init, copy screenshots into each feature's `designs/` folder:

```bash
SRC="docs/screenshots"
FEATURES=".planning/features"

# fleet-management — all carrier/driver screenshots
cp "$SRC/carrier_details.png" "$FEATURES/fleet-management/designs/"
cp "$SRC/carrier_onboarding.png" "$FEATURES/fleet-management/designs/"
cp "$SRC/carrier_onboarding_details.png" "$FEATURES/fleet-management/designs/"
cp "$SRC/driver_details.png" "$FEATURES/fleet-management/designs/"
cp "$SRC/carrier_portal_blling.png" "$FEATURES/fleet-management/designs/"
cp "$SRC/carrier_portal_dashboard.png" "$FEATURES/fleet-management/designs/"
cp "$SRC/carrier_portal_documents.png" "$FEATURES/fleet-management/designs/"
cp "$SRC/carrier_portal_drivers_vehicles.png" "$FEATURES/fleet-management/designs/"
cp "$SRC/carrier_portal_load_history.png" "$FEATURES/fleet-management/designs/"
cp "$SRC/carrier_portal_prefernces.png" "$FEATURES/fleet-management/designs/"

# load-management — dispatch board, load creator, load detail
cp "$SRC/dispatch_board.png" "$FEATURES/load-management/designs/"
cp "$SRC/dispatch_board_kanban.png" "$FEATURES/load-management/designs/"
cp "$SRC/dispatch_board_table.png" "$FEATURES/load-management/designs/"
cp "$SRC/create_load.png" "$FEATURES/load-management/designs/"
cp "$SRC/load_details.png" "$FEATURES/load-management/designs/"

# dashboard
cp "$SRC/dashboard.png" "$FEATURES/dashboard/designs/"

# load-intelligence
cp "$SRC/load_intelligence.png" "$FEATURES/load-intelligence/designs/"
```

Verify: `ls .planning/features/fleet-management/designs/*.png | wc -l` should be 10.

**>>> PAUSE — Show user the list of initialized features and confirm screenshots are in place.**

---

## Step 4: Pre-Populate Feature PRDs

Read `docs/feature-manifest.md` and copy each feature's relevant section into `.planning/features/<key>/PRD.md`.

Each feature PRD should include:
- The **Shared Context Preamble** (from the top of feature-manifest.md) as a prefix
- The feature-specific sections: Summary, Scope, Capabilities, Success Criteria, Data Requirements, User Flows, Affected Services, Technical Context

Do all 9 features:
1. foundation
2. fleet-management
3. place-management
4. load-management
5. documents-bol
6. invoicing
7. dashboard
8. load-intelligence
9. chrome-extension

**>>> PAUSE — Let user spot-check 2-3 PRD files to confirm content was copied correctly.**

---

## Step 5: Refine Features (`/prd-refine`)

Run `/prd-refine` for each feature **in dependency order**. For each one, paste the conversation starter from `docs/feature-manifest.md` (found under each feature's "/prd-refine Conversation Starter" heading).

**IMPORTANT:** Each sub-step below is a separate `/prd-refine` invocation. Pause after EACH one.

**SCREENSHOTS:** For features that have screenshots (see Screenshots Reference table above), READ the screenshot image files using the Read tool during refinement. Use them to verify data fields, UI layout, and user flows match the design. Cross-check that every visible data field in the screenshot has a corresponding API field in the stories.

### 5a. foundation

```
/prd-refine foundation
```

Conversation starter:
> This feature's requirements are defined in docs/prd.md lines 55-94 (Business Model), 95-126 (Roles), 809-877 (State Machine), 925-987 (Sequences/Pagination/Presigned URLs), 950-976 (Error Handling). The TDD at docs/tdd.md has the complete Prisma schema (lines 262-842), Redis data structures (846-1006), state machine implementation (1010-1070), onboarding gate (1074-1105), financial calculations (1109-1148), and all scoring utilities (1152-1335). This is backend-only — no UI. Generate stories for: schema + migration, shared utilities, Redis/S3/geo config, scoring utils, constants, error handling, auth middleware, seed script.

**>>> PAUSE — Review generated stories for foundation.**

### 5b. fleet-management

```
/prd-refine fleet-management
```

Conversation starter:
> Requirements in docs/prd.md lines 355-400 (Carrier Onboarding) and 688-738 (Fleet & Carrier Management). TDD has models at lines 274-498 and endpoints at 1413-1447. Read ALL design screenshots in .planning/features/fleet-management/designs/ (10 PNGs: carrier_details, carrier_onboarding, carrier_onboarding_details, driver_details, and 6 carrier_portal_* views). Use the carrier portal screenshots to inform carrier detail page data fields and layout. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Generate BE stories for carriers/drivers/vehicles/contacts CRUD + onboarding gate, FE stories for list/detail pages.

**>>> PAUSE — Review generated stories for fleet-management.**

### 5c. place-management

```
/prd-refine place-management
```

Conversation starter:
> Requirements in docs/prd.md lines 764-806 (Place Management). TDD has Place model at lines 631-668 and endpoints at 1436-1442. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Generate BE stories for places CRUD + typeahead + geo auto-lookup, FE stories for list/detail/form pages + reusable PlaceTypeahead component.

**>>> PAUSE — Review generated stories for place-management.**

### 5d. load-management

```
/prd-refine load-management
```

Conversation starter:
> Requirements in docs/prd.md lines 129-322 (Dispatch Board, Load Creator, Load Detail, Broker Rate Con) and 809-877 (State Machine). TDD has models at lines 505-731, state machine at 1010-1070, endpoints at 1396-1412. Read ALL design screenshots in .planning/features/load-management/designs/ (5 PNGs: dispatch_board, dispatch_board_kanban, dispatch_board_table, create_load, load_details). Use them to verify kanban columns, table columns, form fields, and detail page layout. This feature depends on fleet-management and place-management. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Max 12 stories. Generate BE stories for load CRUD + state machine + side effects + check calls, FE stories for dispatch board (Kanban + table) + load creator stepper + load detail page.

**>>> PAUSE — Review generated stories for load-management.**

### 5e. documents-bol

```
/prd-refine documents-bol
```

Conversation starter:
> Requirements in docs/prd.md lines 323-354 (BOL Workflow), 879-895 (Document Types), 934-948 (Presigned URL flow). TDD has Document model at lines 783-821 and endpoints at 1443-1447. Depends on load-management. Generate BE stories for document presign/confirm/list + BOL workflow + rate con handling, FE stories for upload component + BOL prompts + document list.

**>>> PAUSE — Review generated stories for documents-bol.**

### 5f. invoicing

```
/prd-refine invoicing
```

Conversation starter:
> Requirements in docs/prd.md lines 401-431 (Invoice Manager) and 897-924 (Email Specs). TDD has Invoice model at lines 733-781 and endpoints at 1449-1465. Depends on load-management + documents-bol. Generate BE stories for invoice auto-generation + approval + PDF + SES email + payment tracking, FE stories for invoice list + detail + PDF template + approval queue.

**>>> PAUSE — Review generated stories for invoicing.**

### 5g. dashboard

```
/prd-refine dashboard
```

Conversation starter:
> Requirements in docs/prd.md lines 740-763 (Dashboard). TDD endpoints at 1496-1500. Read the design screenshot at .planning/features/dashboard/designs/dashboard.png — use it to verify KPI cards, chart layout, and attention items section. Depends on load-management + invoicing. Generate BE stories for KPIs + weekly gross + attention items endpoints, FE stories for dashboard page + chart + attention section.

**>>> PAUSE — Review generated stories for dashboard.**

### 5h. load-intelligence

```
/prd-refine load-intelligence
```

Conversation starter:
> Requirements in docs/prd.md lines 433-687 (Load Intelligence Feed — all subsections). TDD has Redis structures at lines 846-1006, intelligence engine at 1152-1392, endpoints at 1467-1504. Read the design screenshot at .planning/features/load-intelligence/designs/load_intelligence.png — use it to verify feed layout, card fields, scoring display, and action buttons. Depends on foundation + fleet-management. Max 12 stories. Generate BE stories for ingestion API + scoring + market data + backhaul search + chain assembly + book load/chain, FE stories for feed page + intel card + manual entry + truck breakdown.

**>>> PAUSE — Review generated stories for load-intelligence.**

### 5i. chrome-extension

```
/prd-refine chrome-extension
```

Conversation starter:
> Requirements in docs/prd.md lines 464-493 (DAT Chrome Extension — 3 modes). TDD has extension directory structure at lines 242-258. Depends on load-intelligence API (ingestion endpoint must exist). Generate stories for: manifest + service worker, DAT scraper with selector fallbacks, market scraper, auto-capture mode, bulk multi-tab, normalizer + dedup, popup UI.

**>>> PAUSE — Review generated stories for chrome-extension.**

---

## Step 6: Freeze Contracts

Run `/contract-freeze` for features with API endpoints (skip foundation and chrome-extension):

1. `/contract-freeze fleet-management`
2. `/contract-freeze place-management`
3. `/contract-freeze load-management`
4. `/contract-freeze documents-bol`
5. `/contract-freeze invoicing`
6. `/contract-freeze dashboard`
7. `/contract-freeze load-intelligence`

**>>> PAUSE — Let user review generated OpenAPI contracts before proceeding to build.**

---

## Step 7: Build Phase A — Foundation

```
/build foundation
```

Wait for completion.

**>>> PAUSE — Show build results. Let user review foundation code before proceeding.**

---

## Step 8: Build Phase B — Core CRUD

These can run in parallel Claude Code sessions, or sequentially:

```
/build fleet-management
/build place-management
```

Wait for both to finish.

**>>> PAUSE — Show build results for both. Let user review before proceeding.**

---

## Step 9: Build Phase C — Load Core

These can run in parallel:

```
/build load-management
/build load-intelligence
```

Wait for both to finish.

**>>> PAUSE — Show build results for both. Let user review before proceeding.**

---

## Step 10: Build Phase D — Operations

Run in order (invoicing depends on documents-bol):

```
/build documents-bol
/build invoicing
/build dashboard
```

**>>> PAUSE — Show build results. Let user review before proceeding.**

---

## Step 11: Build Phase E — Extension

```
/build chrome-extension
```

**>>> PAUSE — Show build results. Let user review before proceeding.**

---

## Step 12: Verify

Run verification in build order:

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

Then integration smoke test:

```bash
docker compose up
npm run lint && npm run typecheck && npm run test
```

**>>> DONE — All features built and verified.**
