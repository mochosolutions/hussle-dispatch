# Requirements: FleetCommand — MVP Staging Demo

**Defined:** 2026-05-13
**Core Value:** A solo dispatcher can run one real load end-to-end on staging — dispatch → SMS-prompted driver portal check-ins → BOL/POD uploads → auto-generated customer invoice → settlement PDF — without a developer in the loop.

## v1 Requirements

Requirements for the staging-shippable MVP. Tracks 1–11 are already code-verified (see PROJECT.md Validated section); these are what remain to clear the three Done Criteria.

### Staging Configuration

<!-- Track 0 carry-over: provisioning credentials/IDs on the staging environment. -->

- [ ] **STG-01**: Twilio SMS backend live on staging (`SMS_BACKEND=twilio` + `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM_NUMBER` set; real SMS sends end-to-end)
- [ ] **STG-02**: SES email backend live on staging (`SES_FROM_EMAIL` set + AWS creds; real emails deliver from staging)
- [ ] **STG-03**: S3 storage backend live on staging (`STORAGE_BACKEND=s3` + `S3_BUCKET` + AWS creds; presigned PUT/GET work for document uploads)
- [ ] **STG-04**: AWS Location service live on staging (`AWS_LOCATION_PLACE_INDEX_NAME` + `AWS_LOCATION_ROUTE_CALCULATOR_NAME` + `AWS_LOCATION_MAP_NAME` set; typeahead/routing/map tiles respond)
- [ ] **STG-05**: All outstanding Prisma migrations applied to the staging Postgres database; schema in sync with `prisma/schema.prisma`

### UI Alignment (Track 12)

<!-- Each entity page adopts the load/dispatch building blocks: FilterBar + ListKpiBar + DataGrid with clickable rows, DetailPageShell for detail, FormDrawer + Redux drawer registry for drawers. Not pixel-perfect — same building blocks. -->

- [ ] **UI-01**: Carriers list, detail, and drawers aligned to load/dispatch pattern (FilterBar + ListKpiBar + DataGrid; DetailPageShell; FormDrawer drawers opened/closed via Redux registry; dirty-form blocking)
- [ ] **UI-02**: Drivers list, detail, and drawers aligned to load/dispatch pattern
- [ ] **UI-03**: Vehicles list, detail, and drawers aligned to load/dispatch pattern
- [ ] **UI-04**: Customers list, detail, and drawers aligned to load/dispatch pattern
- [ ] **UI-05**: Contacts list, detail, and drawers aligned to load/dispatch pattern
- [ ] **UI-06**: Places list, detail, and drawers aligned to load/dispatch pattern
- [ ] **UI-07**: Side-by-side visual review across all six entity pages confirms shared building blocks; no entity is an outlier

### MVP Polish

<!-- Demo-grade polish. "Polished demo" target, not pixel-perfection. -->

- [ ] **POL-01**: Switch off-mode uses neutral color (not the secondary palette)
- [ ] **POL-02**: Typography scaled up globally — body and label sizes increased to match the demo target
- [ ] **POL-03**: Skeleton loaders render on list and detail pages while data is fetching (replace full-screen spinners)
- [ ] **POL-04**: Alerts and toasts position bottom-right consistently
- [ ] **POL-05**: All drawer submit buttons use the shared loading-state button component
- [ ] **POL-06**: Framer-motion animations applied to page transitions, drawer open/close, and alert enter/exit
- [ ] **POL-07**: Drawer header color sourced from theme token (not hardcoded per feature)
- [ ] **POL-08**: Signup form renders realtime password-requirements feedback with a visible rules list
- [ ] **POL-09**: `.gitignore` prevents `dist/` directories from being committed; any tracked `dist/` folder removed from the index

### Done Criteria — Playwright E2E

- [ ] **E2E-01**: Playwright spec covers the full MVP loop end-to-end: create carrier (all 3 types) → onboard with required docs → create driver (all 4 pay types) → create customer → create load → assign → dispatch → DISPATCHED SMS fires (mock Twilio) → driver portal check-in → pre-pickup SMS → transit SMS → upload BOL via portal → mark delivered → invoice auto-generated → customer email sent → mark paid → generate settlement → download settlement PDF
- [ ] **E2E-02**: Screenshots attached at every critical assertion in the E2E spec; report stored under `playwright-report/` or `e2e-results/screenshots/`

### Done Criteria — Manual Test Script

- [ ] **MAN-01**: `docs/mvp-test-script.md` written as a human checklist mirroring the E2E flow (every screen, every action, every expected confirmation)
- [ ] **MAN-02**: Human walks through `docs/mvp-test-script.md` on staging end-to-end; every checkbox marked complete; any failures filed as defects

### Done Criteria — Real Dispatcher Trial

- [ ] **TRIAL-01**: A real dispatcher (not the developer) runs one real load through staging end-to-end: book → assign → dispatch → driver completes portal flow → BOL uploads → invoice sent → settlement generated
- [ ] **TRIAL-02**: Post-trial debrief captured; gaps logged as follow-up tickets (non-blocking unless they prevent the loop from completing)

## v2 Requirements

Tracked but deferred to the next milestone, not in the current roadmap.

### Settlement Automation

- **SETL-V2-01**: Weekly settlement auto-draft cron job (scaffolded but disabled; ticketed as 9.DEFER.1)
- **SETL-V2-02**: Driver-specific settlement history view (settlements are carrier-scoped today)
- **SETL-V2-03**: Carrier-side factoring routing for DISPATCH_FEE invoices (mirror the customer-side `billingMethod=FACTORED` pattern)
- **SETL-V2-04**: Carrier-side factoring fields exposed in the carrier form drawer

### Notifications

- **NOTF-V2-01**: Twilio delivery webhook callbacks for delivery-state tracking (3.INF.1)
- **NOTF-V2-02**: Customer-level default `ccEmails` on `CustomerNotificationSettings` (currently only per-load override + contact fallback)
- **NOTF-V2-03**: WebSocket push migration replacing saga polling loops (notification history, SMS prompt history, load status freshness); supersedes Track 3 US-06 #6 backoff work

### Dispatch Operations

- **OPS-V2-01**: Dispatcher commission tracking + payroll (schema fields retained: `Load.dispatcherUserId`, `Load.dispatcherComm`)
- **OPS-V2-02**: Insurance expiry nightly cron (currently dispatch-time gate + UI badge only)
- **OPS-V2-03**: Invoice send UI drawer exposes `ccEmails` input (API already supports it)
- **OPS-V2-04**: `NotificationOverrideDrawer` adopts the new `EmailChipsField` component (cosmetic consistency with `ContactInfoDrawer`)

### Hardening

- **HARD-V2-01**: API-wide Yup `.strict()` / `.noUnknown()` to reject unknown keys
- **HARD-V2-02**: Tests for `invoiceGenerationService` / `invoiceBuilderService` (requires port-injection refactor)
- **HARD-V2-03**: Fix pre-existing `AddressSearchField.test.tsx` (2 failing tests; component drift)
- **HARD-V2-04**: `ContextualAlert` bug on load detail — says "POD uploaded, all docs present" unconditionally on DELIVERED
- **HARD-V2-05**: Tighten Send Invoice idempotency response from 400 `ValidationError` to 409 `ConflictError`
- **HARD-V2-06**: Defensive `payType`/`payRate` null-checks in `settlementService` + `calculateFinancials` are dead code post-Track 7 backfill — sweep for removal

### Customer Portal

- **PORTAL-V2-01**: Shipper/broker self-service portal — tracking + document access (mirrors carrier dual-org pattern, will need `customerOrgId` FK)

### Audit Items (Post-MVP)

- **AUD-V2-01**: HIGH-06 Invoice Builder page (manual line item editing)
- **AUD-V2-02**: HIGH-07 OVERDUE invoice auto-transition
- **AUD-V2-03**: HIGH-08 Payment history model (currently overwrite-only)
- **AUD-V2-04**: HIGH-14 Document expiry enforcement job
- **AUD-V2-05**: HIGH-16 Receipt upload UI for dispatchers
- **AUD-V2-06**: HIGH-17 Vehicle finance fields in UI
- **AUD-V2-07**: HIGH-18 Vehicle weekly revenue chart
- **AUD-V2-08**: HIGH-20 Market data auto-refresh

## Out of Scope

Explicitly excluded from this milestone. Documented to prevent re-scoping.

| Feature | Reason |
|---------|--------|
| Customer portal (shipper self-service) | Email + PDF delivery sufficient for MVP; portal requires `customerOrgId` FK pattern (per scope-lock 2026-04-21) |
| Production hardening | Staging demo only; production launch is a downstream milestone |
| OWNER_OPERATOR carrier type | Merged into EXTERNAL_CARRIER (scope-lock 2026-04-21); migration applied in Track 1 |
| Dispatcher commission tracking | Solo-operator persona = self-dispatch; schema fields retained for post-MVP payroll track (scope-lock 2026-04-24) |
| Settlement auto-draft cron | Manual generation only for MVP (9.DEFER.1) |
| Insurance expiry nightly job | Dispatch-time gate + UI badge sufficient (6.BE.3 scope-lock) |
| SMS quiet hours / driver availability honoring | "No quiet hours" — send anytime while load active (scope-lock 2026-04-21) |
| WebSocket push migration | Saga polling acceptable at staging-demo scale; push migration is its own milestone |
| Twilio delivery webhook callbacks | Synchronous SID capture on send is sufficient (3.INF.1) |
| Rate-cons in load templates | Rate cons are per-load contracts, never reusable (5.UI.2) |
| QuickBooks integration | Out of MVP scope per `mvp-plan.md` DEFERRED |
| FMCSA auto-verification | Out of MVP scope per `mvp-plan.md` DEFERRED |
| Trip miles geofencing auto-arrival | Out of MVP scope per `mvp-plan.md` DEFERRED |
| Dashboard onboarding tool, load map + Relay nav, notes CRUD, today/tomorrow feed filter, team comm, driver "find matching loads" | All deferred per `mvp-plan.md` DEFERRED |
| Customer notifications: `CustomerNotificationSettings.ccEmails` default | Out of MVP — per-load override + contact fallback only |
| Pixel-perfect entity-page visual parity | "Same building blocks across entities," not pixel-perfect (scope-lock 2026-04-21) |

## Traceability

Populated during roadmap creation by the gsd-roadmapper agent.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STG-01 | Phase 1 | Pending |
| STG-02 | Phase 1 | Pending |
| STG-03 | Phase 1 | Pending |
| STG-04 | Phase 1 | Pending |
| STG-05 | Phase 1 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |
| UI-05 | Phase 2 | Pending |
| UI-06 | Phase 2 | Pending |
| UI-07 | Phase 2 | Pending |
| POL-01 | Phase 3 | Pending |
| POL-02 | Phase 3 | Pending |
| POL-03 | Phase 3 | Pending |
| POL-04 | Phase 3 | Pending |
| POL-05 | Phase 3 | Pending |
| POL-06 | Phase 3 | Pending |
| POL-07 | Phase 3 | Pending |
| POL-08 | Phase 3 | Pending |
| POL-09 | Phase 3 | Pending |
| E2E-01 | Phase 4 | Pending |
| E2E-02 | Phase 4 | Pending |
| MAN-01 | Phase 5 | Pending |
| MAN-02 | Phase 5 | Pending |
| TRIAL-01 | Phase 6 | Pending |
| TRIAL-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27 ✓
- Unmapped: 0

---
*Requirements defined: 2026-05-13*
*Last updated: 2026-05-13 after roadmap creation (traceability populated)*
