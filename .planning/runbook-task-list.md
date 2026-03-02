# FleetCommand MACHO Runbook — Task List

> Track progress through the full build pipeline. Check off each task as completed.

---

## Step 0: Install MACHO Tools
- [x] Copy MACHO tools (bin, agents, skills, hooks) into `.claude/`
- [x] Verify: `macho-tools.js`, `backend-coder.md`, `bootstrap/SKILL.md` all exist

## Step 1: Bootstrap
- [x] Run `/bootstrap` to generate `.planning/` directory
- [x] Verify: `packages.json`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `config.json` exist

## Step 2: Configure Speed Settings
- [x] Edit `.planning/config.json` with speed settings (ceremonyCommits, fixLoopLimit, gates)

## Step 3: Initialize All 9 Features
- [x] 3.1 `/feature-init foundation`
- [x] 3.2 `/feature-init fleet-management`
- [x] 3.3 `/feature-init place-management`
- [x] 3.4 `/feature-init load-management`
- [x] 3.5 `/feature-init documents-bol`
- [x] 3.6 `/feature-init invoicing`
- [x] 3.7 `/feature-init dashboard`
- [x] 3.8 `/feature-init load-intelligence`
- [x] 3.9 `/feature-init chrome-extension`

## Step 4: Pre-Populate Feature PRDs
- [x] 4.1 Pre-populate PRD: **foundation** (done — 685 lines)
- [x] 4.2 Pre-populate PRD: **fleet-management** (done — 297 lines)
- [x] 4.3 Pre-populate PRD: **place-management** (done — 258 lines)
- [x] 4.4 Pre-populate PRD: **load-management** (done — 264 lines)
- [x] 4.5 Pre-populate PRD: **documents-bol** (done — 264 lines)
- [x] 4.6 Pre-populate PRD: **invoicing** (done — 284 lines)
- [x] 4.7 Pre-populate PRD: **dashboard** (done — 234 lines)
- [x] 4.8 Pre-populate PRD: **load-intelligence** (done — 270 lines)
- [x] 4.9 Pre-populate PRD: **chrome-extension** (done — 275 lines)

## Step 5: Refine Features (`/prd-refine`)
- [x] 5a. `/prd-refine foundation` — schema, utilities, Redis/S3/geo, scoring, auth, seed (9 BE stories, 4 TDD)
- [x] 5b. `/prd-refine fleet-management` — carriers/drivers/vehicles/contacts CRUD, onboarding status, list/detail pages (4 BE + 6 FE = 10 stories)
- [ ] 5c. `/prd-refine place-management` — places CRUD, typeahead, geo lookup, list/detail/form pages
- [ ] 5d. `/prd-refine load-management` — load CRUD, state machine, dispatch board, load creator, load detail
- [ ] 5e. `/prd-refine documents-bol` — document presign/confirm, BOL workflow, upload component
- [ ] 5f. `/prd-refine invoicing` — invoice auto-gen, approval, PDF, SES email, payment tracking
- [ ] 5g. `/prd-refine dashboard` — KPIs, weekly gross, attention items, chart, dashboard page
- [ ] 5h. `/prd-refine load-intelligence` — ingestion, scoring, market data, backhaul, chain assembly, feed UI
- [ ] 5i. `/prd-refine chrome-extension` — manifest, DAT scraper, market scraper, auto-capture, popup UI

## Step 6: Freeze Contracts (`/contract-freeze`)
- [ ] 6.1 `/contract-freeze fleet-management`
- [ ] 6.2 `/contract-freeze place-management`
- [ ] 6.3 `/contract-freeze load-management`
- [ ] 6.4 `/contract-freeze documents-bol`
- [ ] 6.5 `/contract-freeze invoicing`
- [ ] 6.6 `/contract-freeze dashboard`
- [ ] 6.7 `/contract-freeze load-intelligence`

## Step 7: Build Phase A — Foundation
- [ ] 7.1 `/build foundation`

## Step 8: Build Phase B — Core CRUD
- [ ] 8.1 `/build fleet-management`
- [ ] 8.2 `/build place-management`

## Step 9: Build Phase C — Load Core
- [ ] 9.1 `/build load-management`
- [ ] 9.2 `/build load-intelligence`

## Step 10: Build Phase D — Operations
- [ ] 10.1 `/build documents-bol`
- [ ] 10.2 `/build invoicing` (depends on 10.1)
- [ ] 10.3 `/build dashboard`

## Step 11: Build Phase E — Extension
- [ ] 11.1 `/build chrome-extension`

## Step 12: Verify All Features
- [ ] 12.1 `/verify-feature foundation`
- [ ] 12.2 `/verify-feature fleet-management`
- [ ] 12.3 `/verify-feature place-management`
- [ ] 12.4 `/verify-feature load-management`
- [ ] 12.5 `/verify-feature load-intelligence`
- [ ] 12.6 `/verify-feature documents-bol`
- [ ] 12.7 `/verify-feature invoicing`
- [ ] 12.8 `/verify-feature dashboard`
- [ ] 12.9 `/verify-feature chrome-extension`
- [ ] 12.10 Integration smoke test: `docker compose up` + `npm run lint && npm run typecheck && npm run test`
