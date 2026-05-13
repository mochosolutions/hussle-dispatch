# FleetCommand — MVP Staging Demo

## What This Is

FleetCommand is a freight dispatch operating system for small-fleet dispatchers: one operator runs every load from broker booking through driver SMS prompts, portal check-ins, document collection, customer invoicing, and carrier/driver settlement. This project scopes the **final push to a staging-shippable MVP** — the dispatch loop already runs end-to-end in code; we are closing verification, UI alignment, polish, and the live trial gate.

## Core Value

**A solo dispatcher can run one real load end-to-end on staging** — dispatch → SMS-prompted driver portal check-ins → BOL/POD uploads → auto-generated customer invoice → settlement PDF — without a developer in the loop.

## Requirements

### Validated

<!-- Shipped and code-verified in Tracks 0–11. Locked. -->

- ✓ **VAL-01** Twilio/SES/S3/AWS Location ports production-ready (Track 0)
- ✓ **VAL-02** Audit logging wired for logout, org switch, role change (Track 0)
- ✓ **VAL-03** Settlement Decimal accumulation correct (Track 0)
- ✓ **VAL-04** Carrier primary contact uses `primaryContactId` FK pattern (Track 0)
- ✓ **VAL-05** `invoiceReadinessSubscriber` is sole invoice creator (Track 0)
- ✓ **VAL-06** `OWNER_OPERATOR` carrier type dropped; migration applied (Track 1)
- ✓ **VAL-07** EXTERNAL/LEASED branching audited end-to-end (Track 1)
- ✓ **VAL-08** Dispatch terms field reconciled at UI HTTP boundary (Track 1)
- ✓ **VAL-09** 401/403 global axios interceptor + atomic popup reset (Track 1)
- ✓ **VAL-10** `StatusChangeDialog` mark-dispatched flow (Track 2)
- ✓ **VAL-11** Send Invoice action wired to `POST /invoices/from-load/:loadId` (Track 2)
- ✓ **VAL-12** Manual check-call drawer + notification subscriber (Track 2)
- ✓ **VAL-13** CC emails on contacts + notification overrides (Track 2)
- ✓ **VAL-14** Custom accessorial type (OTHER) with required description (Track 2)
- ✓ **VAL-15** Address typeahead with debounce, abort, TTL cache (Track 2)
- ✓ **VAL-16** Hybrid SMS prompt scheduler — DISPATCHED + pre-pickup + post-pickup + transit interval (Track 3)
- ✓ **VAL-17** Manual SMS send endpoint + UI modal (Track 3)
- ✓ **VAL-18** RabbitMQ delayed-message exchange for prompt scheduling (Track 3)
- ✓ **VAL-19** Portal deep-link via existing driver tracking token (Track 3)
- ✓ **VAL-20** Org-configurable SMS timing (lead/interval/escalation/cooldown) (Track 3)
- ✓ **VAL-21** SMS prompt history panel on load detail (Track 3)
- ✓ **VAL-22** Driver portal Playwright suite (94 tests, mobile + desktop) (Track 4)
- ✓ **VAL-23** Driver portal document upload — MIME + size validation (Track 4)
- ✓ **VAL-24** Stop `schedulingType` exposed in driver portal (Track 4)
- ✓ **VAL-25** Check-in error surfacing + notes character limit (Track 4)
- ✓ **VAL-26** `s3Url` → `url` rename across model + responses (Track 5)
- ✓ **VAL-27** Driver portal upload consolidated to `PortalDocumentUpload` (Track 5)
- ✓ **VAL-28** Onboarding gate blocks at Documents phase for EXTERNAL/LEASED (Track 6)
- ✓ **VAL-29** Admin "Dispatch anyway" override with audit log (Track 6)
- ✓ **VAL-30** Onboarding completion email sends via SES (Track 6)
- ✓ **VAL-31** Insurance expiry badges on carrier KPI (Track 6)
- ✓ **VAL-32** Driver `payType` + `payRate` required at creation + backfill migration (Track 7)
- ✓ **VAL-33** Driver weekly schedule + override drawers (Track 7)
- ✓ **VAL-34** Driver location auto-geocodes on `PATCH /drivers/:id` (Track 7)
- ✓ **VAL-35** Dispatch fee model: PERCENTAGE + FLAT, per-carrier + per-load override (Track 8+9)
- ✓ **VAL-36** EXTERNAL_CARRIER auto-generates DISPATCH_FEE invoice on delivery (Track 8+9)
- ✓ **VAL-37** Customer `billingMethod` (DIRECT/FACTORED) — DRAFT + skip auto-email when FACTORED (Track 8+9)
- ✓ **VAL-38** Settlement DRIVER_PAY line for all 4 payTypes (Track 8+9)
- ✓ **VAL-39** Settlement role-gating (writes ADMIN/DISPATCHER; approve/pay ADMIN-only) (Track 8+9)
- ✓ **VAL-40** Settlement PDF download (Track 8+9)
- ✓ **VAL-41** Per-org API keys + `apiKeyAuth` middleware (Track 10)
- ✓ **VAL-42** Chrome extension TS port — DAT + Relay scrapers, popup UX, failure surfacing (Track 10)
- ✓ **VAL-43** Strict ingest validation + Redis dedup (Track 10)
- ✓ **VAL-44** Tenant-scoped notification queries (load joined on `organizationId`) (Track 11)
- ✓ **VAL-45** `DOCUMENT_UPLOADED` event → enriched customer notification (Track 11)

### Active

<!-- Remaining work to ship staging demo. -->

#### Verification — Track 0 staging configuration

- [ ] **STG-01** Set `SMS_BACKEND=twilio` + `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER` in staging `.env`
- [ ] **STG-02** Set `SES_FROM_EMAIL` + AWS credentials for SES on staging
- [ ] **STG-03** Set `STORAGE_BACKEND=s3` + `S3_BUCKET` + AWS credentials on staging
- [ ] **STG-04** Set `AWS_LOCATION_PLACE_INDEX_NAME` + `AWS_LOCATION_ROUTE_CALCULATOR_NAME` + `AWS_LOCATION_MAP_NAME` on staging
- [ ] **STG-05** Apply all outstanding Prisma migrations on staging DB

#### UI Alignment — Track 12 (all 6 entity pages)

- [ ] **UI-01** Carriers — list (FilterBar + ListKpiBar + DataGrid) + detail (DetailPageShell) + drawers (FormDrawer + drawer registry)
- [ ] **UI-02** Drivers — list + detail + drawers aligned to load/dispatch pattern
- [ ] **UI-03** Vehicles — list + detail + drawers aligned
- [ ] **UI-04** Customers — list + detail + drawers aligned
- [ ] **UI-05** Contacts — list + detail + drawers aligned
- [ ] **UI-06** Places — list + detail + drawers aligned
- [ ] **UI-07** Side-by-side visual review across all 6 entities

#### MVP Polish

- [ ] **POL-01** Switch off-mode color uses neutral (not secondary)
- [ ] **POL-02** Typography scale up globally (body/label sizes)
- [ ] **POL-03** Skeleton loaders on list + detail pages (replace full-screen spinners)
- [ ] **POL-04** Alerts/toasts position bottom-right
- [ ] **POL-05** Drawer submit buttons use loading state button component
- [ ] **POL-06** Framer-motion animations — page transitions, drawer open/close, alert enter/exit
- [ ] **POL-07** Drawer header color from theme token
- [ ] **POL-08** Signup password requirements — realtime feedback + rules list
- [ ] **POL-09** `.gitignore` — ensure `dist/` directories never committed

#### Done Criteria — V.E2E Playwright

- [ ] **E2E-01** Playwright spec covering full MVP loop: create carrier (3 types) → onboard → create driver (4 pay types) → create customer → create load → assign → dispatch → DISPATCHED SMS → portal check-in → pre-pickup SMS → transit SMS → BOL upload → deliver → invoice auto-generated → email sent → mark paid → generate settlement → download PDF
- [ ] **E2E-02** Screenshots attached at every critical assertion

#### Done Criteria — V.MAN Manual Test Script

- [ ] **MAN-01** Write `docs/mvp-test-script.md` (human checklist form)
- [ ] **MAN-02** Human walk-through on staging — every step checked

#### Done Criteria — V.TRIAL Real Dispatcher Trial

- [ ] **TRIAL-01** Real dispatcher runs one real load end-to-end on staging
- [ ] **TRIAL-02** Debrief + log gaps as follow-ups (non-blocking unless critical)

### Out of Scope

<!-- Explicit deferrals. Add as we discover edges. -->

- **Customer portal** — Email-only delivery for MVP; portal is post-MVP (per scope-lock 2026-04-21)
- **Settlement cron auto-draft** (9.DEFER.1) — Manual generation only for MVP
- **Dispatcher commission tracking** — Schema fields kept; dropped from MVP per solo-operator persona refinement (2026-04-24)
- **Insurance expiry nightly job** (6.BE.3) — Dispatch-time gate + UI badge sufficient; nightly cron post-MVP
- **WebSocket push migration** — Saga polling acceptable for MVP; supersedes per-loop backoff work (Track 3 US-06 #6)
- **SMS quiet hours / driver availability honoring** — No quiet hours; scheduler does not consult `DriverAvailability` (per scope-lock)
- **OWNER_OPERATOR carrier type** — Merged into EXTERNAL_CARRIER (per scope-lock)
- **Twilio delivery webhook callbacks** (3.INF.1) — Synchronous SID capture sufficient; revisit post-MVP
- **Rate-con in load templates** (5.UI.2) — Rate cons are per-load contracts, never reusable
- **Production hardening** — Staging demo only; production launch is a downstream milestone
- **Customer portal, dashboard onboarding tool, load map/Relay nav, notes CRUD, today/tomorrow feed filter, team comm, "find matching loads"** — All explicitly deferred per `docs/tasks/mvp-plan.md` DEFERRED section
- **HIGH-06/07/08/14/16/17/18/20 audit items** — Tracked in audit; post-MVP
- **QuickBooks integration, FMCSA auto-verification, geofencing auto-arrival** — Post-MVP
- **Backfill tests for `invoiceGenerationService` / `invoiceBuilderService`** — Requires port-injection refactor; deferred
- **Yup `.strict()` / `.noUnknown()` API-wide** — Broader hardening; post-MVP

## Context

**Codebase state.** Brownfield monorepo with two TS packages (`hussle-app-dispatch-api/`, `hussle-app-dispatch-ui/`) + `hussle-emails/` (React Email) + `dat-load-scraper/` (Chrome extension). Express + Prisma + Postgres + Redis + RabbitMQ (delayed-message exchange) backend; React 18 + MUI v5 + Redux Toolkit + Saga + Vite frontend. Internal dispatch SPA and public carrier/driver portals share the same UI repo.

**Prior planning.** A comprehensive audit (2026-04-20) and consolidated MVP plan (2026-04-21, last updated 2026-04-26) live in `docs/`. Legacy phase artifacts moved to `.planning-legacy/` before this GSD bootstrap (commit 291219735). Codebase map regenerated 2026-05-13 (commit 514f779d1).

**Test posture.** 968/968 backend tests green; UI tests 163/165 (two pre-existing `AddressSearchField` failures); driver-portal Playwright 94/94. End-to-end Playwright for the full MVP loop is the headline remaining work.

**External services.** Twilio (SMS), AWS SES (email), AWS S3 (document storage, presigned URLs), AWS Location (typeahead/routing/maps), Postgres, Redis, RabbitMQ with `rabbitmq_delayed_message_exchange` plugin v3.13.0.

**Infrastructure.** Terraform/Ansible/Dokploy stack built 2026-04-28. Dev environment bootstrapped on mocho's shared server; staging deploy pending Dokploy API token.

## Constraints

- **Tech stack** — Locked: Node + Express + Prisma + React 18 + MUI v5 + Redux Toolkit + Saga + Formik/Yup + Jest + Playwright. No framework swaps in this milestone.
- **Deployment target** — Staging demo only. Real Twilio/SES/S3/AWS Location, not production-hardened.
- **Persona** — Small fleet dispatcher (solo operator). No multi-dispatcher commission flows.
- **Carrier types** — COMPANY_ASSET, EXTERNAL_CARRIER, LEASED_CARRIER only.
- **Client delivery** — Email + PDF attachment only (no shipper portal).
- **SMS policy** — Hybrid event-anchored + manual; no quiet hours; org-configurable timing.
- **Settlement generation** — Manual only.
- **Onboarding doc gate** — Must block until docs signed/uploaded; admin override audit-logged.
- **Visual consistency target** — "Same building blocks across entities," not pixel-perfect.
- **Git identity** — All commits must use the configured user identity; no `Co-Authored-By` lines.
- **Test gates** — Done is defined by all three Done Criteria passing: Playwright E2E + manual checklist + real dispatcher trial.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat completed tracks as Validated, scope project to remaining work | Tracks 1–11 are code-verified; re-litigating them adds noise. Active set is verification + Track 12 + Polish + Done Criteria. | — Pending |
| Keep Track 12 (UI alignment) in MVP scope | Per original scope-lock: "all entity pages adopt load/dispatch patterns." Demo polish depends on it. | — Pending |
| All three Done Criteria gate MVP (E2E + manual + real dispatcher trial) | Matches canonical `mvp-plan.md` gate. Real-dispatcher trial catches gaps automation can't. | — Pending |
| `docs/tasks/mvp-plan.md` remains the operational source-of-truth alongside `.planning/` | User follows the MACHO/RUNBOOK workflow; mvp-plan.md is the running ledger. GSD artifacts complement, not replace. | ✓ Good |
| Drop OWNER_OPERATOR carrier type; merge into EXTERNAL_CARRIER | Scope-lock 2026-04-21 — simplifies branching across settlements/onboarding/invoices. | ✓ Good (Track 1) |
| Dispatcher commission dropped from MVP; schema fields retained | Solo-operator persona = self-dispatch; commission flow is a separate post-MVP payroll track. | ✓ Good (Track 8+9) |
| `feeIncludesAccessorials` default = `true` | Customer-billed accessorials inflate the dispatch-fee base — matches industry norm. | ✓ Good (Track 8+9) |
| RabbitMQ delayed-message exchange (not Bull) for SMS prompts | Reuses existing event-bus infra; lower operational surface area. | ✓ Good (Track 3) |
| Saga polling acceptable for MVP; WebSocket migration deferred | Push migration is a milestone unto itself; polling works at staging-demo scale. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-13 after initialization*
