# FleetCommand — Carrier Onboarding Refactor

## What This Is

A magic-link carrier onboarding portal — invited → signed → ready-to-dispatch in under 15 minutes, on a phone, conversational interview UX. Six phases on the carrier side (Company → Equipment → Drivers → Cost Analysis → Lane Preferences → Documents) with mid-flow dispatch-agreement signing. This GSD project tracks the **6-phase architectural refactor** from `docs/carrier-onboarding-implementation-plan.md` — stabilize the existing flow, close security gaps, then incrementally adopt the tech-spec patterns (schema-as-data, pure-function engine, mid-flow signing + field locking, WebSocket scaffold, FMCSA scaffold).

## Core Value

**A carrier can complete onboarding end-to-end on a phone in under 15 minutes** — and the patterns we land here become the architectural standard the rest of the app gets refactored toward.

## Requirements

### Validated

<!-- Already-shipped Phase 1 carrier-portal work (backend ~95%, frontend ~70%). -->

- ✓ **VAL-01** `OnboardingSession` model with `currentPhase`, `currentQuestionIndex`, `answers` JSONB, `completedPhases`, `lastActiveAt`
- ✓ **VAL-02** `CarrierInviteToken` model — 7-day expiry, revocation support (plaintext today; hashing in Phase 1)
- ✓ **VAL-03** `Carrier` extended — `onboardingStatus`, `minimumRatePerMile`, `entryMethod`, `costProfileVersion`/`Source`, consent IP/UA, fuel card providers
- ✓ **VAL-04** `Vehicle` extended — `category` enum, `gvwr`, financing fields, insurance cost, delivery types
- ✓ **VAL-05** `Document` model — `signatureData` (base64), `reviewStatus`, signed timestamps
- ✓ **VAL-06** Carrier portal endpoints — GET/PUT session, POST per-phase saves, document presign/confirm/sign
- ✓ **VAL-07** Admin endpoints — invite, resend, approve, reject, pending queue
- ✓ **VAL-08** Token-auth middleware (`authenticateCarrierToken`)
- ✓ **VAL-09** Events — `carrier.invited`, `carrier.onboarding.completed`/`approved`/`rejected`
- ✓ **VAL-10** Email templates — invite, approval, rejection, completion
- ✓ **VAL-11** SMS via Twilio + subscribers for invitation/approval notifications
- ✓ **VAL-12** `CarrierPortalPage` — 4-phase flow (Company, Equipment, Drivers, Documents)
- ✓ **VAL-13** `ConversationalForm` with 15 input types
- ✓ **VAL-14** `PortalLayout`, `PortalHeader`, `PortalStepper`, `PortalFooterBar`, `PortalAuthGuard`
- ✓ **VAL-15** Question definitions for Phases 1–3 + Documents
- ✓ **VAL-16** Redux slice + sagas (fetchSession, savePhaseData)
- ✓ **VAL-17** Auto-save via 500ms debounced `PUT /carrier-portal/session/answer`
- ✓ **VAL-18** Admin UI — invite dialog, approval modal, pending carriers card, onboarding tab

### Active

<!-- 6 phases from docs/carrier-onboarding-implementation-plan.md. -->

#### Phase 0 — Stabilize (≈3 working days)

- [ ] **STAB-01**: `handleSubmit` in `CarrierPortalPage` dispatches phase-save actions; phase advance moves to `useEffect` watching save-success state
- [ ] **STAB-02**: Validation errors surfaced visibly via notistack snackbar; scroll to first error field
- [ ] **STAB-03**: Final-phase logic dispatches `completeOnboarding` (API), not `sessionCompleted` (local only)
- [ ] **STAB-04**: Phase list extracted to `features/carrier-portal/constants.ts`; consumed by both `CarrierPortalPage` and `PortalLayout`
- [ ] **STAB-05**: `setCurrentPhase` reducer no longer silently guards on `if (state.session)` (remove the mask; surface bugs)
- [ ] **STAB-06**: `costAnalysisQuestions.ts` built per `.planning-legacy/carrier-onboarding/designs/interview-cost-analysis.md`
- [ ] **STAB-07**: `PresetTileSelector` component (pill-shaped chips + custom-value option)
- [ ] **STAB-08**: `CostResultCard` component (dark-bg full-screen result; animated count-up; break-even RPM + minimum booking rate)
- [ ] **STAB-09**: `lanePreferencesQuestions.ts` built
- [ ] **STAB-10**: `StateGrid` component (50-state clickable grid with preference cycling: preferred / avoided / neutral)
- [ ] **STAB-11**: `SubQuestion` + `SubAnswer` components with colored left borders (blue/green/red/grey)
- [ ] **STAB-12**: `presetTiles` and `stateGrid` cases added to `InputRenderer`
- [ ] **STAB-13**: `PHASE_LABELS` and `TOTAL_PHASES` expanded to 6 phases
- [ ] **STAB-14**: Playwright e2e test — invite → portal → all 6 phases → submit → approve; runs in CI
- [ ] **STAB-15**: Manual smoke test of full flow

#### Phase 1 — Security & Hygiene (≈3 working days)

- [ ] **SEC-01**: Hashed invitation tokens — `tokenHash` column with `@@unique`, HMAC-SHA-256 with peppered env/KMS key, migration backfills hash for existing tokens, lookup queries use hash, plaintext column dropped after backfill verification
- [ ] **SEC-02**: EIN encryption — `einCiphertext: Bytes?` column with AES-256-GCM via KMS data key (cached in app memory), `einLast4: String?` denormalized plaintext for UI, decrypt only for downstream PDF generation, migration encrypts existing values and drops plaintext column
- [ ] **SEC-03**: Composite index `(organizationId, dotNumber)` on `Carrier`
- [ ] **SEC-04**: Document retention policy at `docs/legal-retention-policy.md` (7-year retention for signed agreements + audit logs)

#### Phase 2 — Schema + Engine (≈10 working days)

- [ ] **SCH-01**: `hussle-app-dispatch-api/src/carrier-onboarding/schemas/v1.ts` declarative Phase → Step → Question shape
- [ ] **SCH-02**: Predicate operators — `eq`, `in`, `and`, `or`, `not` (skip `jsonpath` until needed)
- [ ] **SCH-03**: Prefill bindings — structured objects `{ source: 'fmcsa' | 'invitation' | 'answers', field/stepId/questionId }`
- [ ] **SCH-04**: Side-effect descriptors — `fmcsa_lookup`, `generate_agreement`, `eligibility_recalc`, `notify_dispatcher`
- [ ] **SCH-05**: Step types (8) — `segmentation`, `input`, `verification`, `upload`, `signing`, `review`, `checkpoint`, `complete`
- [ ] **SCH-06**: Field types — existing 15 `ConversationalForm` types + 4 new (`email`, `phone`, `cards`, `mc`)
- [ ] **SCH-07**: JSON Schema validator (`ajv`) runs at import time and in CI
- [ ] **SCH-08**: Existing TS question files migrated to new schema shape (still TS, not DB)
- [ ] **ENG-01**: `hussle-app-dispatch-api/src/carrier-onboarding/engine/` directory created
- [ ] **ENG-02**: Pure functions — `evaluatePredicate`, `resolveContext`, `getVisibleSteps`, `getNextStepId`, `getPrevStepId`, `computeInvalidations`
- [ ] **ENG-03**: Engine types — `Command`, `EngineResult`, `EngineError`, `EngineWarning`, `DomainEventEnvelope`
- [ ] **ENG-04**: Declarative `ValidationRule[]` per question (`required`, `minLength`, `regex`, `email`, `mc_number`, `requiredWhen`, `mustEqualField`) compiled to Yup at runtime
- [ ] **ENG-05**: Named business-rule registry (start empty; add as needed) for complex cross-field rules
- [ ] **ENG-06**: ESLint rule — `engine/` cannot import from `services/`, `controllers/`, `repositories/`, `prisma`
- [ ] **ENG-07**: Engine pure-function unit tests target ~100% coverage
- [ ] **ENG-08**: Existing `carrier-portal/` services consume engine for visibility/navigation/validation (keep save logic in services)
- [ ] **ENG-09**: New API contract — `getSchema(token)` endpoint returns active schema; client renders + validates via engine output
- [ ] **DOC-01**: ADR-001 — "Carrier onboarding adopts schema + engine pattern" written at `docs/adrs/`
- [ ] **DOC-02**: README in `engine/` — pure-function rule, boundary, testing strategy

#### Phase 3 — Mid-Flow Signing + Field Locking (≈5 working days)

- [ ] **SIGN-01**: Schema insert — `signing` step after business profile + signatory phases, before equipment
- [ ] **SIGN-02**: `locksFields: string[]` metadata on the signing step definition
- [ ] **SIGN-03**: Engine `NavigateBack` handler refuses navigation to locked fields when any downstream signing step is `Signed`; returns `LOCK_VIOLATION` warning
- [ ] **SIGN-04**: Backend `VoidAgreement` command (admin-only) — transitions agreement to `Voided`, archives signature data, unlocks fields, emits `agreement.voided`
- [ ] **SIGN-05**: Frontend — read-only display + lock icon + "contact dispatcher" CTA for locked fields
- [ ] **SIGN-06**: Frontend — signing step renders mid-flow with dispatch agreement preview + signature canvas
- [ ] **SIGN-07**: E-SIGN consent capture (IP + UA on `Carrier`) verified to fire at the right moment
- [ ] **SIGN-08**: Completion flow updated — signing mid-flow; post-signing carrier continues to equipment/banking/docs

#### Phase 4 — WebSocket Scaffold (≈5 working days)

- [ ] **WS-01**: Socket.io server in dispatch-api — auth: carrier opaque token (query param + `Authorization` header upgrade); dispatcher JWT cookie
- [ ] **WS-02**: Redis pub/sub fan-out using existing `redisClient`
- [ ] **WS-03**: Two channels — `session-state.{sessionId}` (carrier-side), `dispatcher.{orgId}.invitations` (dispatcher-side)
- [ ] **WS-04**: Connection lifecycle — auth → join channel → server pushes on state changes → graceful close
- [ ] **WS-05**: Client-side hook `useSessionWebSocket(sessionId)` in `features/carrier-portal/hooks/` — subscribe, reconnection w/ exponential backoff
- [ ] **WS-06**: Smoke feature — echo session state changes across carrier's open tabs (proves the pipe; no business value yet)
- [ ] **WS-07**: `docs/websocket-patterns.md` — adding WS-driven features, channel auth model, reconnection patterns
- [ ] **WS-08**: Load test — 1k concurrent connections on Dokploy container; baseline numbers documented
- [ ] **DOC-03**: ADR-002 — "WebSocket gateway adopts Socket.io + Redis pub/sub; per-session + per-org channels"

#### Phase 5 — FMCSA Scaffold (≈3 working days)

- [ ] **FMC-01**: Events added to `eventMap.ts` — `onboarding.fmcsa.requested`, `onboarding.fmcsa.completed`
- [ ] **FMC-02**: `FmcsaLookupSubscriber` in `hussle-app-dispatch-api/src/carrier-onboarding/fmcsa/` consumes `requested`, calls mock adapter, publishes `completed`
- [ ] **FMC-03**: `SaferWebPort` interface defined
- [ ] **FMC-04**: `MockSaferWebAdapter` returning realistic fake data (legalName, dba, address, dotNumber, fleetSize, safetyRating, authorityStatus, officerName)
- [ ] **FMC-05**: `fmcsaSnapshot: Json?` field on `OnboardingSession`
- [ ] **FMC-06**: Engine handler for `verification` step type — waits for `fmcsa.completed` ExternalEvent before advancing
- [ ] **FMC-07**: Schema integration — `prefillFrom: { source: 'fmcsa', field: 'legalName' }` works against `fmcsaSnapshot`
- [ ] **FMC-08**: UI — verification step shows "Looking up your authority…" spinner; advances on event arrival
- [ ] **DOC-04**: ADR-003 — "FMCSA integration via SaferWebPort + adapter pattern; mock first, real later"

### Out of Scope

<!-- All deferrals from §7 of the implementation plan, plus explicit rejections from prior decisions. -->

| Capability | Revisit when |
|---|---|
| JSON-stored schema + version pinning | Non-engineer needs to edit flows, or in-flight schema migrations become a real problem |
| Pure-function engine for save logic (full command/result decomposition) | Service-layer test pain becomes painful |
| Event sourcing / `OnboardingEvent` log | Carrier dispute requires session replay, or legal review demands it |
| Outbox pattern | **Rejected outright** — events publish inline as today; reject again unless real event-loss incident occurs |
| DocuSeal migration | Legal review requires audit certificate, or base64 signing causes a real dispute |
| Live eligibility sidebar | Sales/UX commits; needs Phase 4 done first |
| Co-pilot bidirectional editing | **Deferred indefinitely** — wait for real support workflow demanding it |
| Session abandonment watchdog | Abandoned sessions exceed 20% rate |
| Carrier Cognito provisioning | Post-onboarding carrier portal becomes a real use case |
| Dispatcher dashboard real-time updates | Dispatchers complain about staleness; needs Phase 4 done first |
| Real SaferWebAPI integration | Provider contract + pricing signed |
| Document OCR (Textract) | Manual review volume becomes unmanageable |
| Self-registration entry point | Sales pipeline supports unsolicited inbound |

## Context

**Why this matters.** Carrier onboarding is the first concrete touchpoint where FleetCommand's "fewer clicks to result" promise meets reality. It sets the carrier's mental model of the platform, and the patterns landed here become the architectural standard for the rest of the app.

**Where the work lives.**
- API: `hussle-app-dispatch-api/src/carrier-portal/` + `hussle-app-dispatch-api/src/carriers/`
- UI: `hussle-app-dispatch-ui/src/features/carrier-portal/` + `hussle-app-dispatch-ui/src/features/carrier/`
- Form primitives: `hussle-app-dispatch-ui/src/components/ConversationalForm/`
- DB schema: `hussle-app-dispatch-api/prisma/schema.prisma`
- Messaging: `hussle-app-dispatch-api/src/shared/messaging/`
- Email templates: `hussle-app-dispatch-api/src/shared/emails/carrierInvite/`
- Legacy Phase 1 artifacts (authoritative for what shipped): `.planning-legacy/carrier-onboarding/`
- Tech-spec sources: `docs/onboarding-example-tech-spec/`

**Known bugs blocking traffic.**
1. `Save & Continue` does nothing visible — `handleSubmit` (CarrierPortalPage:76) never dispatches phase-save actions
2. Hardcoded 4-phase list in two places (PortalLayout:18, CarrierPortalPage:25) — drift hazard
3. `setCurrentPhase` reducer silently guards on `if (state.session)` (carrierPortalSlice:95-99)
4. Final phase dispatches local-only `sessionCompleted` instead of API `completeOnboarding` (CarrierPortalPage:81-83)
5. Validation failures invisible — no snackbar; errors only show if InputRenderer wires them correctly

**Carrier-arrival contingencies.**
- Carriers arrive in week 2 → existing flow handles them post-Phase-0+1; Phase 2 happens during traffic; data migrates when Phase 2 lands
- Carriers arrive in week 4 → onboarding on new architecture from day one
- Carriers arrive in week 6+ → full plan ships before traffic

**MVP relationship.** The MVP staging-demo work continues in parallel via `docs/tasks/mvp-plan.md` as the operational ledger. The archived MVP GSD roadmap lives at `.planning-archive/mvp-staging-demo/` for reference.

## Constraints

- **Solo engineer (Jr building).** Sequential phases only; no parallelization across phases. Phases land with clean exit criteria.
- **Top priority for the next ~6 weeks.** Real carriers arriving in weeks. Existing flow must work before traffic.
- **Dev mode — no production carriers yet.** Replace in place; no parallel-stack maintenance; no feature-flag overhead.
- **Sets the architectural standard.** Patterns established here get copied to future features. Quality and clarity matter.
- **Refactor toward, don't rewrite.** Every step preserves working code. New abstractions land alongside old ones until validated.
- **Schema is data, stored as code first.** Declarative predicates/prefill/side-effects — yes. JSON-in-DB + version-pinning — only when there's a real need.
- **Engine is an interface, not a rewrite.** Pure-function engine exposes visibility/navigation/validation; existing services consume it; full command/result decomposition can wait.
- **Infrastructure ships before features use it.** WebSocket gateway + FMCSA event topology land empty, prove the pipe, then features adopt them.
- **Security hygiene non-negotiable.** Token hashing, EIN encryption, UI bug fixes. Cheap, real, can't defer.
- **Test at boundaries.** Engine purity defended via ESLint import rule. Services stay imperative-style with mocked repos.
- **No half-finished implementations.** Each phase has an exit criterion. Don't move on until the previous phase ships.
- **Standard is available, not mandatory.** The schema/engine pattern earns its keep for declarative-rule features. For non-declarative features (load dispatch, settlement math), let the pattern not apply.
- **Tech stack.** Node + Express + Prisma + Postgres + Redis + RabbitMQ on the API; React 18 + MUI v5 + Redux Toolkit + Saga + Yup on the UI. Validator: Yup (codebase incumbent).
- **Git identity.** No `Co-Authored-By` lines. Use configured user identity only.

## Key Decisions

Locked decisions from the implementation plan — do not relitigate.

| Decision | Choice | Outcome |
|----------|--------|---------|
| Migration posture | Replace in place (dev mode permits) | ✓ Good |
| Tech-spec scope | Adopt 4 core features (schema, WebSocket, FMCSA scaffold, mid-flow signing); defer the rest with revisit conditions | — Pending |
| Architectural approach | Incremental refactor toward tech-spec patterns, not greenfield rebuild | — Pending |
| Standard-setting | This work sets the pattern for future features (schema + engine + boundary ESLint rule) | — Pending |
| Phase sequencing | Strictly sequential; solo dev; ruthless scope discipline; ADR per phase; Playwright e2e as safety net | — Pending |
| Outbox pattern | **Rejected** (events publish inline as today) | ✓ Good |
| DocuSeal | Deferred — base64 signing continues | ✓ Good |
| Co-pilot mode | Deferred indefinitely | ✓ Good |
| Event sourcing | Deferred — `AuditLog` covers current needs | ✓ Good |
| Carrier Cognito | Deferred — opaque token suffices | ✓ Good |
| WebSocket scope | Scaffold only initially; features that use it ship later | — Pending |
| Scoring engine | Local in-process behind `EligibilityProvider` port | — Pending |
| FMCSA | Adopt scaffold; real SaferWebAPI integration deferred | — Pending |
| Schema language | Declarative concepts (predicates, prefill bindings, step types); keep TS files (no DB storage yet) | — Pending |
| Engine architecture | Thin pure-function engine alongside existing services; not full command/result rewrite | — Pending |
| Token type | Opaque (matches existing); add HMAC-SHA-256 hashing in Phase 1 | — Pending |
| Token expiration | 7-day unopened (tighter than tech spec's 14/30) | ✓ Good |
| EIN encryption | App-layer AES-256-GCM with KMS data key; `einLast4` denormalized | — Pending |
| Validator library | Yup (codebase incumbent) | ✓ Good |
| Field locking after signature | Adopt — engine refuses NavigateBack to locked fields | — Pending |
| Frontend state | Redux + Saga (codebase consistency) | ✓ Good |
| Mid-flow signing | Adopt as core feature; refactor existing Phase 6 signing | — Pending |

## Risk Gates

From §8 of the implementation plan:

| Gate | Trigger | Action |
|---|---|---|
| End of Phase 0 | Flow still doesn't work end-to-end | **Stop.** Don't proceed to architecture work until carriers can complete onboarding. |
| Mid Phase 2 (day 6 of 10) | Engine refactor >50% over budget | **Stop. Step back. Rescope.** Cost of "engine done wrong" > cost of "TS arrays done well." |
| End of Phase 2 | Engine unit tests reveal logic bugs in existing services | Patch in-place. Don't ship a "perfectly redesigned" engine if it surfaces bugs we have to fix. |
| Before Phase 4 ships | WS gateway load test fails | Reassess deployment topology — possibly extract to its own container. |
| Before any real SaferWebAPI work | Provider contract / pricing unclear | Pause. Don't integrate before legal + commercial signed. |
| Any phase | Solo-dev burnout symptoms | Each phase has a natural shipping moment. Take a breath between them. |

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
*Last updated: 2026-05-13 after re-bootstrap from `docs/carrier-onboarding-implementation-plan.md`*
