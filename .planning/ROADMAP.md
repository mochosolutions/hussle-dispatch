# Roadmap: FleetCommand — Carrier Onboarding Refactor

## Overview

Six sequential architectural phases that take the carrier onboarding flow from "broken end-to-end with security gaps" to "running on the schema + engine pattern that becomes the architectural standard for the rest of the app." Phase 1 stabilizes the existing flow so carriers can actually complete onboarding. Phase 2 closes cheap, real security gaps before any real PII flows through. Phase 3 lands the architectural standard (declarative schema + pure-function engine + ESLint boundary rule). Phase 4 adopts mid-flow signing with field locking. Phase 5 scaffolds the WebSocket pipe. Phase 6 scaffolds the FMCSA integration behind a port + mock adapter. Solo-dev sequential execution per `docs/carrier-onboarding-implementation-plan.md` — each phase has a hard exit criterion and a defined risk gate before the next phase begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Stabilize** - Fix Save & Continue, surface validation errors, complete the 6-phase carrier UI, add the Playwright safety net
- [ ] **Phase 2: Security & Hygiene** - Hash invitation tokens, encrypt EIN at rest, add composite index, write retention policy
- [ ] **Phase 3: Schema + Engine** - Declarative schema + pure-function engine + ESLint boundary rule + ADR-001 — the architectural standard
- [ ] **Phase 4: Mid-Flow Signing + Field Locking** - Carrier signs after business identity; locked fields enforced by engine; admin-only VoidAgreement
- [ ] **Phase 5: WebSocket Scaffold** - Socket.io + Redis pub/sub + per-session/per-org channels + load test + ADR-002
- [ ] **Phase 6: FMCSA Scaffold** - SaferWebPort + MockSaferWebAdapter + `verification` step type + ADR-003

## Phase Details

### Phase 1: Stabilize
**Goal**: Existing 6-phase carrier onboarding flow works end-to-end without intervention — unblocks earlier-than-expected carrier traffic and provides the Playwright safety net the rest of the project relies on.
**Depends on**: Nothing (first phase)
**Requirements**: STAB-01, STAB-02, STAB-03, STAB-04, STAB-05, STAB-06, STAB-07, STAB-08, STAB-09, STAB-10, STAB-11, STAB-12, STAB-13, STAB-14, STAB-15
**Success Criteria** (what must be TRUE):
  1. A carrier can complete the full 6-phase onboarding flow (Company → Equipment → Drivers → Cost Analysis → Lane Preferences → Documents) end-to-end on a phone without intervention
  2. `Save & Continue` dispatches the phase-save action, advances on save-success, and the final phase hits the `completeOnboarding` API (not local-only `sessionCompleted`)
  3. Validation failures surface visibly via notistack snackbar and the page scrolls to the first error field
  4. Phase metadata (`PHASE_LABELS`, `TOTAL_PHASES`, phase list) lives in a single `features/carrier-portal/constants.ts` consumed by both `CarrierPortalPage` and `PortalLayout`
  5. Playwright e2e test `invite → portal → all 6 phases → submit → approve` runs green in CI
**Plans**: 8 plans
- [x] 01-01-PLAN.md — Wave 0 test scaffolds (jest harnesses + playwright stub for STAB-01/02/03/05/07/08/10/11/12/14)
- [x] 01-02-PLAN.md — Slice + saga foundation (lift currentPhase, lastSavedPhase rising-edge, 2 new save action triples + saga workers + API client; STAB-01 mechanism + STAB-03 saga + STAB-05)
- [x] 01-03-PLAN.md — Phase metadata constants + PortalLayout migration (STAB-04 PortalLayout side + STAB-13)
- [x] 01-04-PLAN.md — Cost analysis schema + CostResultCard rebuild + questionSchema PresetOption (STAB-06, STAB-08)
- [x] 01-05-PLAN.md — Lane preferences schema (STAB-09)
- [x] 01-06-PLAN.md — CarrierPortalPage wiring: saga-driven Save & Continue + validation snackbar + scroll-to-error + completeOnboarding dispatch + constants imports (STAB-01 full, STAB-02, STAB-03 full, STAB-04 page side)
- [ ] 01-07-PLAN.md — Component wiring: InputRenderer presetTiles case + StateGrid a11y attrs + SubQuestion typography 16/600 (STAB-07, STAB-10, STAB-11, STAB-12)
- [ ] 01-08-PLAN.md — Playwright e2e flip + SMOKE-CHECKLIST.md + CI hook (STAB-14, STAB-15)
**UI hint**: yes

### Phase 2: Security & Hygiene
**Goal**: Close cheap, real safety gaps before any real PII flows through — hashed tokens, encrypted EIN, composite index on the carrier lookup path, written retention policy.
**Depends on**: Phase 1 (Risk Gate #1 — flow must work end-to-end before architectural work; per §8 of the plan, if Phase 1 doesn't ship, stop and don't proceed)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. No plaintext sensitive data remains in the DB — invitation tokens are stored only as HMAC-SHA-256 hashes; EIN is stored only as AES-256-GCM ciphertext (`einCiphertext`) plus a denormalized `einLast4` for UI
  2. Token lookups query by hash; EIN decryption happens only at downstream PDF-generation time
  3. `Carrier` table has a composite index on `(organizationId, dotNumber)` and queries use it
  4. `docs/legal-retention-policy.md` documents the 7-year retention policy for signed agreements + audit logs
  5. SOC2-relevant DB-dump exposure on the carrier-onboarding path is closed (no plaintext token, no plaintext EIN, no plaintext SSN on Carrier columns)
**Plans**: TBD

### Phase 3: Schema + Engine
**Goal**: Adopt the schema-as-data + pure-function engine pattern additively. Existing services consume the engine for visibility/navigation/validation; save logic stays in services. This sets the architectural standard the rest of the app gets refactored toward.
**Depends on**: Phase 2 (sequential per solo-dev constraint; Risk Gate #2 at day 6 of 10 — if engine refactor is >50% over budget, stop and rescope to TS-arrays-done-well)
**Requirements**: SCH-01, SCH-02, SCH-03, SCH-04, SCH-05, SCH-06, SCH-07, SCH-08, ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07, INT-01, INT-02, DOC-01, DOC-02
**Success Criteria** (what must be TRUE):
  1. The `engine/` module imports nothing from `services/`, `controllers/`, `repositories/`, or `prisma` — enforced by a custom ESLint rule that breaks the build on violation
  2. All visibility, navigation, and validation logic for carrier onboarding lives in tested pure functions (`evaluatePredicate`, `getVisibleSteps`, `getNextStepId`, `getPrevStepId`, `computeInvalidations`) with ~100% unit-test coverage
  3. The existing carrier onboarding flow still works end-to-end against the engine-driven schema (Playwright e2e from Phase 1 still passes)
  4. The schema validates against its JSON Schema via `ajv` at import time and in CI; existing TS question files are migrated to the new schema shape (still TS, not DB)
  5. `getSchema(token)` endpoint returns the active schema; client renders + validates via engine output
  6. ADR-001 ("Carrier onboarding adopts schema + engine pattern") and `engine/README.md` (pure-function rule, boundary, testing strategy) are written
**Plans**: TBD
**UI hint**: yes

### Phase 4: Mid-Flow Signing + Field Locking
**Goal**: Move dispatch-agreement signing to mid-flow (after business profile + signatory, before equipment). Engine refuses NavigateBack to locked fields after signing; admins can void agreements to unlock fields and request re-sign.
**Depends on**: Phase 3 (engine must exist; `NavigateBack` handler, `locksFields` metadata, and `signing` step type all live inside the engine + schema landed in Phase 3)
**Requirements**: SIGN-01, SIGN-02, SIGN-03, SIGN-04, SIGN-05, SIGN-06, SIGN-07, SIGN-08
**Success Criteria** (what must be TRUE):
  1. A carrier signs the dispatch agreement mid-flow after entering business identity (business profile + signatory phases) and before equipment/banking/docs
  2. Attempting to edit a locked field (one declared in the signing step's `locksFields: string[]`) is blocked when any downstream signing step is `Signed` — engine returns `LOCK_VIOLATION` warning; UI shows read-only display + lock icon + "contact dispatcher" CTA
  3. An admin can issue `VoidAgreement` which transitions the agreement to `Voided`, archives signature data, unlocks the affected fields, and emits `agreement.voided`
  4. E-SIGN consent capture (IP + UA on `Carrier`) fires at the signing moment, not before or after
  5. Post-signing, the carrier continues forward to equipment/banking/docs — completion no longer requires signing at the end
**Plans**: TBD
**UI hint**: yes

### Phase 5: WebSocket Scaffold
**Goal**: Real-time infrastructure (Socket.io + Redis pub/sub) lands empty, proves the pipe, and documents the pattern. No business features consume it yet — features that need WS ship later in their own sprints.
**Depends on**: Phase 4 (sequential per solo-dev constraint; Risk Gate #4 — load test must pass 1k concurrent before Phase 5 is allowed to ship; if it fails, reassess deployment topology / possibly extract WS to its own container)
**Requirements**: WS-01, WS-02, WS-03, WS-04, WS-05, WS-06, WS-07, WS-08, DOC-03
**Success Criteria** (what must be TRUE):
  1. Two browser tabs on the same carrier session observe state changes propagate from one tab to the other via WebSocket (smoke feature proves the pipe end-to-end)
  2. Socket.io server in dispatch-api authenticates carriers via opaque token and dispatchers via JWT cookie; channels `session-state.{sessionId}` (carrier) and `dispatcher.{orgId}.invitations` (dispatcher) are live
  3. Client-side `useSessionWebSocket(sessionId)` hook handles subscribe + reconnection with exponential backoff
  4. Load test demonstrates 1k concurrent connections on a Dokploy container; baseline numbers documented
  5. ADR-002 ("WebSocket gateway adopts Socket.io + Redis pub/sub; per-session + per-org channels") and `docs/websocket-patterns.md` are written
**Plans**: TBD

### Phase 6: FMCSA Scaffold
**Goal**: Wire the FMCSA contract end-to-end behind a `SaferWebPort` interface with a `MockSaferWebAdapter`. Engine handles `verification` step type by waiting for the `fmcsa.completed` event. Real SaferWebAPI integration becomes a one-line composition-root change later.
**Depends on**: Phase 5 (sequential per solo-dev constraint; Risk Gate #5 — real SaferWebAPI is gated on signed provider contract + pricing, so this phase scaffolds the mock only)
**Requirements**: FMC-01, FMC-02, FMC-03, FMC-04, FMC-05, FMC-06, FMC-07, FMC-08, DOC-04
**Success Criteria** (what must be TRUE):
  1. The `verification` step transitions correctly end-to-end with mock data — UI shows "Looking up your authority…" spinner, then advances when `onboarding.fmcsa.completed` arrives
  2. Replacing the mock with a real adapter is a one-line composition-root change — `SaferWebPort` interface is the seam; `MockSaferWebAdapter` returns realistic fake data (legalName, dba, address, dotNumber, fleetSize, safetyRating, authorityStatus, officerName)
  3. `onboarding.fmcsa.requested` and `onboarding.fmcsa.completed` events live in `eventMap.ts` and flow through `FmcsaLookupSubscriber`
  4. `OnboardingSession.fmcsaSnapshot: Json?` is populated; schema `prefillFrom: { source: 'fmcsa', field: 'legalName' }` resolves against it
  5. ADR-003 ("FMCSA integration via SaferWebPort + adapter pattern; mock first, real later") is written
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 (strictly sequential per solo-dev constraint).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Stabilize | 0/8 | Not started | - |
| 2. Security & Hygiene | 0/TBD | Not started | - |
| 3. Schema + Engine | 0/TBD | Not started | - |
| 4. Mid-Flow Signing + Field Locking | 0/TBD | Not started | - |
| 5. WebSocket Scaffold | 0/TBD | Not started | - |
| 6. FMCSA Scaffold | 0/TBD | Not started | - |
