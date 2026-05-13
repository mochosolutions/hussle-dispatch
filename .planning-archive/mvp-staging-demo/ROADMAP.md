# Roadmap: FleetCommand — MVP Staging Demo

## Overview

The dispatch loop already runs end-to-end in code (Tracks 1–11 code-verified). This roadmap closes the remaining cross-cutting work needed to ship a staging demo: provisioning staging credentials, aligning all entity pages to the load/dispatch pattern, applying demo-grade polish, then clearing the three Done Criteria (Playwright E2E + manual checklist + real dispatcher trial). Phases group by work type, not by user capability — the user capabilities are already built.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Staging Configuration** - Provision Twilio, SES, S3, AWS Location credentials and apply Prisma migrations on the staging environment
- [ ] **Phase 2: UI Alignment (Track 12)** - Adopt the load/dispatch building blocks across all six entity pages
- [ ] **Phase 3: MVP Polish** - Demo-grade visual + interaction polish across the dispatch SPA
- [ ] **Phase 4: Playwright E2E Spec** - Automate the full MVP loop end-to-end with screenshots at every critical assertion
- [ ] **Phase 5: Manual Test Script + Staging Walkthrough** - Human-readable checklist mirroring the E2E, walked end-to-end on staging
- [ ] **Phase 6: Real Dispatcher Trial** - One real dispatcher runs one real load on staging; debrief gaps captured

## Phase Details

### Phase 1: Staging Configuration
**Goal**: Staging environment runs the dispatch loop against real Twilio/SES/S3/AWS Location with a migrated database
**Depends on**: Nothing (independent of code work — can execute in parallel with Phases 2 and 3)
**Requirements**: STG-01, STG-02, STG-03, STG-04, STG-05
**Success Criteria** (what must be TRUE):
  1. A real SMS sent from staging via `POST /loads/:loadId/sms-prompts` arrives on a real phone (Twilio backend live)
  2. A staging-issued customer invoice email arrives in a real inbox from the configured SES sender
  3. A document uploaded via the driver portal lands in the configured S3 bucket and the presigned GET URL serves the file back
  4. Address typeahead, route calculation, and map tiles respond on staging using the configured AWS Location resources
  5. `npx prisma migrate status` on staging reports the database in sync with `prisma/schema.prisma` (no pending migrations)
**Plans**: TBD

### Phase 2: UI Alignment (Track 12)
**Goal**: All six entity pages (Carriers, Drivers, Vehicles, Customers, Contacts, Places) adopt the same building blocks as load/dispatch — no entity is an outlier
**Depends on**: Nothing (can run in parallel with Phases 1 and 3)
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07
**Success Criteria** (what must be TRUE):
  1. Each entity list page renders FilterBar + ListKpiBar + NewDataGrid with clickable rows that navigate to detail
  2. Each entity detail page uses DetailPageShell (header + tabs + action buttons) consistent with the load detail page
  3. Every drawer for these entities opens/closes via the Redux drawer registry (no component-local `useState` for visibility) and uses `FormDrawer` with `useDirtyFormBlocker`
  4. A side-by-side visual review across all six entities confirms shared building blocks; no page is structurally an outlier
**Plans**: TBD
**UI hint**: yes

### Phase 3: MVP Polish
**Goal**: The dispatch SPA hits the "polished demo" bar — neutral switch off-mode, scaled typography, skeletons, bottom-right toasts, loading-state submit buttons, framer-motion transitions, themed drawer headers, signup password feedback, and a clean `.gitignore`
**Depends on**: Nothing (theme-wide changes mostly orthogonal to Phase 2's per-page restructuring; sequencing is a coordination concern, not a blocking one)
**Requirements**: POL-01, POL-02, POL-03, POL-04, POL-05, POL-06, POL-07, POL-08, POL-09
**Success Criteria** (what must be TRUE):
  1. Switches in off-mode render using the neutral palette, body and label typography are visibly scaled up across the app, and drawer headers source their color from a theme token
  2. List and detail pages render skeleton loaders while data is fetching (no full-screen spinners on first load), and drawer submit buttons render a loading state during async submit
  3. Alerts and toasts surface in the bottom-right; page transitions, drawer open/close, and alert enter/exit animate via framer-motion
  4. The signup form renders realtime password-requirements feedback with a visible rules list as the user types
  5. `.gitignore` excludes `dist/` directories and no `dist/` folder is tracked in the git index
**Plans**: TBD
**UI hint**: yes

### Phase 4: Playwright E2E Spec
**Goal**: A single Playwright spec drives the full MVP loop with screenshot evidence at every critical assertion, runnable against the local stack and (with backend overrides) against staging
**Depends on**: Phase 2 (entity-page selectors must be stable), Phase 3 (polish-driven DOM changes must be in place so selectors don't churn). Independent of Phase 1 for the local run; Phase 1 is required if the spec is targeted at staging.
**Requirements**: E2E-01, E2E-02
**Success Criteria** (what must be TRUE):
  1. `playwright test` runs the full-loop spec green and the spec covers every leg: create carrier (all 3 types) → onboard → create driver (all 4 pay types) → create customer → create load → assign → dispatch → DISPATCHED SMS fires (mocked Twilio) → portal check-in → pre-pickup SMS → transit SMS → BOL upload → mark delivered → invoice auto-generated → customer email sent → mark paid → generate settlement → download settlement PDF
  2. Screenshots are captured at every critical assertion in the spec and the HTML report (`playwright-report/`) plus screenshot artifacts (`e2e-results/screenshots/`) are produced on each run
**Plans**: TBD
**UI hint**: yes

### Phase 5: Manual Test Script + Staging Walkthrough
**Goal**: A human-runnable checklist exists at `docs/mvp-test-script.md` mirroring the E2E flow, and a human has walked it end-to-end on the live staging environment with every step ticked or any failures filed as defects
**Depends on**: Phase 4 (E2E spec coverage informs checklist completeness) for MAN-01; Phase 1 (staging live with real external services) for MAN-02
**Requirements**: MAN-01, MAN-02
**Success Criteria** (what must be TRUE):
  1. `docs/mvp-test-script.md` exists and lists every screen, action, and expected confirmation for the full MVP loop in checklist form
  2. A human walkthrough of `docs/mvp-test-script.md` against staging has every step checked complete; any failures encountered during the walkthrough are filed as defect tickets and triaged
**Plans**: TBD

### Phase 6: Real Dispatcher Trial
**Goal**: One real dispatcher (not the developer) runs one real load through staging end-to-end and the debrief captures any remaining gaps as follow-up tickets
**Depends on**: Phase 1 (staging operational), Phase 5 (manual walkthrough passed — the team's own dogfood pass must succeed before exposing a real user)
**Requirements**: TRIAL-01, TRIAL-02
**Success Criteria** (what must be TRUE):
  1. A real dispatcher books, assigns, dispatches, monitors the driver portal flow, confirms BOL upload, sends the invoice, and generates the settlement on staging without developer intervention
  2. The post-trial debrief is captured and any identified gaps are filed as follow-up tickets; the MVP gate is held open only if a gap is critical enough to prevent the loop from completing

## Progress

**Execution Order:**
Phases execute in numeric order. Phases 1, 2, and 3 are independent and may run in parallel; Phases 4–6 are strictly sequential after their dependencies clear.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Staging Configuration | 0/TBD | Not started | - |
| 2. UI Alignment (Track 12) | 0/TBD | Not started | - |
| 3. MVP Polish | 0/TBD | Not started | - |
| 4. Playwright E2E Spec | 0/TBD | Not started | - |
| 5. Manual Test Script + Staging Walkthrough | 0/TBD | Not started | - |
| 6. Real Dispatcher Trial | 0/TBD | Not started | - |
