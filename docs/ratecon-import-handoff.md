# Ratecon Import — Session Handoff

> Living reference for continuing the **Ratecon Import (email-first ingest)** feature in a fresh session.
> Last updated: 2026-05-28. Read this top-to-bottom, then open the source-of-truth plan + memory below.

## What this feature is

Brokers email rate-con PDFs → ingest → Python vision-LLM extraction → in-app review inbox → "Review" opens a **prefilled Create Load form** → on submit the load is created with the PDF attached and the import is marked ACCEPTED. Manual PDF upload is the fallback/dev path and converges into the same pipeline.

## Source of truth (read these first)

- **Plan (authoritative):** `~/.claude/plans/i-want-to-plan-expressive-bumblebee.md` — full design, task list (19–29), as-built decisions, live API endpoints.
- **Auto-memory (loads automatically):** `~/.claude/projects/-Users-jr-Development-hustle-app-fleet-command/memory/project_ratecon_import.md`
- **Design decision — Option B (do NOT relitigate):** keep `PendingRateconImport` as the review queue; **no `DRAFT` LoadStatus**. Reason: a DRAFT status would force auditing every load consumer to exclude it (`loadRepositoryPrisma.list` has no default status filter → drafts pollute board/metrics/financials). The "draft" IS the import row; review happens in the existing Create Load form.

## Status

| Area | State |
|---|---|
| Python service (extract) + Node `ratecon-imports` module (Tasks 19–24) | ✅ Done + committed |
| UI feature module / inbox / nav badge / accept flow (Tasks 26–28) | ✅ Done (uncommitted) |
| Backend unit tests (Task 29) | ✅ 36 passing (`src/ratecon-imports`) |
| Live e2e | ✅ Verified through prefill (see below) |
| Task 25 (SES/Lambda Terraform) | ⏸ Deploy-time only; Mailpit covers local |

### Verified live (2026-05-28, Playwright)
Login → `/ratecons` → manual upload `CARRCONFIRM.pdf` → real extraction (~47s, MEDIUM) → `PENDING_REVIEW` card → Review → Create Load form **fully prefilled** (ref, $800, REEFER, reefer temps, both stops w/ address+date+time, commodity, dispatcher notes, driver instructions) + review banner (4 warnings + detected-customer hint) + **trip miles 109 / RPM $7.34** + nav badge count. Failure path verified too (EXTRACTION_FAILED → Retry re-extracts).

## Issues fixed this session

1. **403 on all `/ratecons/imports` routes** — route hardcoded `['ADMIN','DISPATCHER']` but `ROLES.ADMIN === 'admin'` (lowercase). Fixed to use `ROLES` constants. → `src/ratecon-imports/routes/rateconImportRoutes.ts`. **Lesson: never hardcode role strings; import from `@/config/roles`.**
2. **`"Python service unreachable: fetch failed"`** — running API container had **empty** `PYTHON_SERVICE_URL`. The container was created from an older compose file; `ts-node-dev` restarts the Node process but NOT the container's Docker env. Fix: `docker compose up -d --no-deps --force-recreate dispatch-api`.
3. **Trip miles not calculated on prefilled loads** — the route calc (`useRouteDistance`) keys off stop `lat`/`lng`; prefill set address strings but no coords. Fixed by geocoding prefilled addresses on mount via `searchAddresses` so coords populate and the existing route/miles/RPM chain fires. → `src/features/load/components/CreateLoadPage/CreateLoadForm/index.tsx` (geocode effect).
4. **"Import rate-con button does nothing"** — NOT a code bug. Verified working on a clean load (file dialog opens, even after using filters). Symptom = a stale tab with an orphaned invisible MUI backdrop intercepting clicks. Fix: hard-refresh (Cmd+Shift+R); if persists, `docker compose restart dispatch-ui`.

## Open / not yet verified

- **import → ACCEPTED transition** not seen end-to-end. Blocked by `AssignmentValidationError` on load create: no **dispatchable** carrier in the dev DB (`carrierAssignmentQuery.findDispatchableById` returns null for all current carriers — onboarding/insurance). This is the generic load-assignment gate, unrelated to ratecon. The accept correctly does NOT fire on a failed create (import stays PENDING_REVIEW). **To verify ACCEPTED: make one carrier dispatchable (complete onboarding / valid insurance), then Review → fill carrier/customer/contact → Create.**
- **(Add new issues you find below.)**

## ⚠️ Pre-existing baseline caveat (NOT ours — do not "fix" as if it's ratecon)

The CreateLoad UI subtree has a **red `check-ts` + lint baseline** independent of this feature, confirmed via `git stash`:
- `CreateLoadForm` initialValues `TS2322`, `CreateLoadPage` `queuedDocuments` excess-prop `TS2353`, `LoadDetailsSection` `sx` `TS2339`, `CreateLoadKpiGroup` implicit-`any`, `react-hooks/refs` on `hasSubmittedRef`.

All ratecon changes add **zero** new type/lint errors over this baseline. When validating, compare against baseline, don't chase these.

## Key files

**Backend** (`hussle-app-dispatch-api/`)
- `src/ratecon-imports/` — module (repo, service, prefill mapper, extraction worker subscriber, webhook + manual upload, routes, controllers, transformers, validators, compositionRoot, index)
- `src/ratecon-imports/services/__tests__/` + `controllers/mappers/__tests__/` — 29 new tests
- `scripts/demoRateconMapping.ts` — run prefill mapper against a saved extraction JSON
- Python: `hussle-app-dispatch-py/` (FastAPI extractor; fixtures at `tests/fixtures/ratecon/*.pdf`)

**Frontend** (`hussle-app-dispatch-ui/`)
- `src/features/ratecon-imports/` — `store/{reducers,sagas,selectors}`, `pages/IndexPage`, `components/RateconImportCard`, `routes/RateconImportRoutes.tsx`, `types.ts`
- `src/utils/api/ratecon-imports/index.ts` — API client (mirrors backend contract)
- `src/components/AppLayout/{index.tsx,menuItem.tsx}` — "Rate Cons" nav item + PENDING_REVIEW badge
- `src/store/reducers/index.ts`, `src/store/sagas/rootsaga.ts` — registration
- `src/features/load/components/CreateLoadPage/CreateLoadForm/index.tsx` — ratecon prefill + geocode-for-trip-miles
- `src/features/load/pages/CreateLoadPage/index.tsx` — review banner + carries `rateconImportId`
- `src/features/load/store/sagas/createLoadSaga.ts` — fires `acceptImportRequest` after successful create

## How to run / verify

```bash
docker compose up -d        # full stack (repo root)
# UI: http://localhost:5173   API: http://localhost:3001
# python-service needs ANTHROPIC_API_KEY in .env; extraction ~45–60s/PDF
# Login: jaredrussell93@gmail.com (role: dispatcher, org: Mocho Solutions)
```
- Sample PDFs: `hussle-app-dispatch-py/tests/fixtures/ratecon/` (use `CARRCONFIRM.pdf` — the verified one).
- Tests: API `cd hussle-app-dispatch-api && npx jest src/ratecon-imports` · Python `cd hussle-app-dispatch-py && .venv/bin/pytest`
- Demo mapper (no stack needed): `cd hussle-app-dispatch-api && npx ts-node --transpile-only scripts/demoRateconMapping.ts ../hussle-app-dispatch-py/tests/output/CARRCONFIRM.json`

## Environment gotchas (bit us this session)

- **API = `ts-node-dev` in Docker.** Source hot-reloads; **Docker env vars do NOT** — recreate the container after compose env changes.
- **Roles are lowercase** (`admin`/`dispatcher`/`viewer`/`driver`) via `@/config/roles`. Never hardcode.
- **Response envelope:** single `{ data }`, list `{ data, meta }` — UI unwraps `.data`.
- **Backend list default** (`GET /ratecons/imports` no params) returns active inbox only (excludes ACCEPTED/REJECTED). UI filters status/source/search client-side over that active set.
