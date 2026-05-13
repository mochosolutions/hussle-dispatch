# Requirements: FleetCommand — Carrier Onboarding Refactor

**Defined:** 2026-05-13
**Core Value:** A carrier can complete onboarding end-to-end on a phone in under 15 minutes — and the patterns landed here become the architectural standard for the rest of the app.

## v1 Requirements

Requirements for the 6-phase refactor scoped at `docs/carrier-onboarding-implementation-plan.md`. Each phase has a hard exit criterion before the next phase starts (per §8 Risk Gates).

### Phase 0 — Stabilize

<!-- Existing flow works end-to-end. Unblocks any earlier-than-expected carrier traffic. -->

- [ ] **STAB-01**: `handleSubmit` in `CarrierPortalPage:76` dispatches phase-save actions; phase advance moves to a `useEffect` watching save-success state
- [ ] **STAB-02**: Validation errors surfaced visibly — notistack snackbar fires when `handleContinue` finds errors; UI scrolls to first error field
- [ ] **STAB-03**: Final-phase logic dispatches `completeOnboarding` (API), replacing local-only `sessionCompleted` at `CarrierPortalPage:81-83`
- [ ] **STAB-04**: Phase list extracted to `features/carrier-portal/constants.ts`; consumed by both `CarrierPortalPage` and `PortalLayout` (eliminates drift at `PortalLayout:18` and `CarrierPortalPage:25`)
- [ ] **STAB-05**: `setCurrentPhase` reducer at `carrierPortalSlice:95-99` no longer silently guards on `if (state.session)` (removes the bug-masking branch)
- [ ] **STAB-06**: `costAnalysisQuestions.ts` built per `.planning-legacy/carrier-onboarding/designs/interview-cost-analysis.md`
- [ ] **STAB-07**: `PresetTileSelector` component implemented — pill-shaped chips with custom-value option
- [ ] **STAB-08**: `CostResultCard` component implemented — dark-bg full-screen result, animated count-up, break-even RPM + minimum booking rate
- [ ] **STAB-09**: `lanePreferencesQuestions.ts` built
- [ ] **STAB-10**: `StateGrid` component implemented — 50-state clickable grid with preference cycling (preferred / avoided / neutral)
- [ ] **STAB-11**: `SubQuestion` + `SubAnswer` components implemented with colored left borders (blue / green / red / grey)
- [ ] **STAB-12**: `presetTiles` and `stateGrid` cases added to `InputRenderer`
- [ ] **STAB-13**: `PHASE_LABELS` and `TOTAL_PHASES` expanded to 6 phases
- [ ] **STAB-14**: Playwright e2e test exists — invite → portal → all 6 phases → submit → approve; runs green in CI
- [ ] **STAB-15**: Manual smoke test of full 6-phase flow passes without intervention

### Phase 1 — Security & Hygiene

<!-- Cheap, real safety gaps closed before any real PII flows through. -->

- [ ] **SEC-01**: Hashed invitation tokens — `tokenHash` column with `@@unique`; HMAC-SHA-256 using peppered env/KMS key; backfill migration computes hash for existing tokens; all lookup queries use hash; plaintext column dropped after backfill verification
- [ ] **SEC-02**: EIN encrypted at rest — `einCiphertext: Bytes?` column with AES-256-GCM via KMS-issued data key (cached in app memory); `einLast4: String?` denormalized for UI; decrypt only when needed for downstream PDF generation; migration encrypts existing values then drops plaintext column
- [ ] **SEC-03**: Composite index `(organizationId, dotNumber)` added to `Carrier`
- [ ] **SEC-04**: Document retention policy written at `docs/legal-retention-policy.md` (7-year retention for signed agreements + audit logs)

### Phase 2 — Schema + Engine

<!-- Architectural standard: schema-as-data (TS files) + pure-function engine. -->

#### Schema layer

- [ ] **SCH-01**: `hussle-app-dispatch-api/src/carrier-onboarding/schemas/v1.ts` defines the declarative Phase → Step → Question shape
- [ ] **SCH-02**: Predicate operators implemented — `eq`, `in`, `and`, `or`, `not` (skip `jsonpath` until needed)
- [ ] **SCH-03**: Prefill bindings — structured objects `{ source: 'fmcsa' | 'invitation' | 'answers', field/stepId/questionId }`
- [ ] **SCH-04**: Side-effect descriptors — `fmcsa_lookup`, `generate_agreement`, `eligibility_recalc`, `notify_dispatcher`
- [ ] **SCH-05**: Step types implemented (8) — `segmentation`, `input`, `verification`, `upload`, `signing`, `review`, `checkpoint`, `complete`
- [ ] **SCH-06**: Field types — existing 15 `ConversationalForm` types + 4 new (`email`, `phone`, `cards`, `mc`)
- [ ] **SCH-07**: JSON Schema validator (`ajv`) runs at import time and in CI
- [ ] **SCH-08**: Existing TS question files migrated to the new schema shape (still TS, not DB)

#### Engine layer

- [ ] **ENG-01**: `hussle-app-dispatch-api/src/carrier-onboarding/engine/` directory exists with the standard module shape from §6
- [ ] **ENG-02**: Pure functions implemented — `evaluatePredicate`, `resolveContext`, `getVisibleSteps`, `getNextStepId`, `getPrevStepId`, `computeInvalidations`
- [ ] **ENG-03**: Engine types defined — `Command`, `EngineResult`, `EngineError`, `EngineWarning`, `DomainEventEnvelope`
- [ ] **ENG-04**: Declarative `ValidationRule[]` per question (`required`, `minLength`, `regex`, `email`, `mc_number`, `requiredWhen`, `mustEqualField`) compiled to Yup at runtime
- [ ] **ENG-05**: Named business-rule registry exists (starts empty; cross-field rules added as needed)
- [ ] **ENG-06**: ESLint rule enforces — `engine/` cannot import from `services/`, `controllers/`, `repositories/`, `prisma`
- [ ] **ENG-07**: Engine pure-function unit-test coverage ~100%

#### Service integration

- [ ] **INT-01**: Existing `carrier-portal/` services consume engine for visibility/navigation/validation; services keep their save logic
- [ ] **INT-02**: New API contract — `getSchema(token)` endpoint returns the active schema; client renders + validates via engine output

#### Documentation

- [ ] **DOC-01**: ADR-001 at `docs/adrs/` — "Carrier onboarding adopts schema + engine pattern"
- [ ] **DOC-02**: `engine/README.md` explains the pure-function rule, the boundary, and the testing strategy

### Phase 3 — Mid-Flow Signing + Field Locking

<!-- Carrier signs after business profile + signatory; fields that fed the agreement lock. -->

- [ ] **SIGN-01**: Schema updated — `signing` step inserted after business profile + signatory phases, before equipment
- [ ] **SIGN-02**: `locksFields: string[]` metadata on the signing step definition
- [ ] **SIGN-03**: Engine `NavigateBack` handler refuses navigation to locked fields when any downstream signing step is `Signed`; returns `LOCK_VIOLATION` warning
- [ ] **SIGN-04**: Backend `VoidAgreement` command (admin-only) — transitions agreement to `Voided`, archives signature data, unlocks fields, emits `agreement.voided`
- [ ] **SIGN-05**: Frontend renders read-only display + lock icon + "contact dispatcher" CTA for locked fields
- [ ] **SIGN-06**: Frontend signing step renders mid-flow with dispatch-agreement preview + signature canvas
- [ ] **SIGN-07**: E-SIGN consent capture (IP + UA on `Carrier`) verified to fire at the right moment
- [ ] **SIGN-08**: Onboarding completion flow updated — signing happens mid-flow; post-signing carrier continues to equipment/banking/docs

### Phase 4 — WebSocket Scaffold

<!-- Real-time infrastructure ready for future features. Empty pipe first. -->

- [ ] **WS-01**: Socket.io server in dispatch-api — auth: carrier opaque token (query param + `Authorization` header upgrade); dispatcher JWT cookie
- [ ] **WS-02**: Redis pub/sub fan-out using existing `redisClient`
- [ ] **WS-03**: Two channels live — `session-state.{sessionId}` (carrier-side), `dispatcher.{orgId}.invitations` (dispatcher-side)
- [ ] **WS-04**: Connection lifecycle — auth → join channel → server pushes on state changes → graceful close
- [ ] **WS-05**: Client-side hook `useSessionWebSocket(sessionId)` in `features/carrier-portal/hooks/` — subscribe, reconnection with exponential backoff
- [ ] **WS-06**: Smoke feature — echo session state changes across the carrier's open tabs (proves the pipe; no business value)
- [ ] **WS-07**: `docs/websocket-patterns.md` written — adding WS-driven features, channel auth model, reconnection patterns
- [ ] **WS-08**: Load test runs — 1k concurrent connections on a Dokploy container; baseline numbers documented
- [ ] **DOC-03**: ADR-002 at `docs/adrs/` — "WebSocket gateway adopts Socket.io + Redis pub/sub; per-session + per-org channels"

### Phase 5 — FMCSA Scaffold

<!-- Wire the contract. Real SaferWebAPI integration is a single-file change later. -->

- [ ] **FMC-01**: New events in `eventMap.ts` — `onboarding.fmcsa.requested`, `onboarding.fmcsa.completed`
- [ ] **FMC-02**: `FmcsaLookupSubscriber` at `hussle-app-dispatch-api/src/carrier-onboarding/fmcsa/` consumes `requested`, calls mock adapter, publishes `completed`
- [ ] **FMC-03**: `SaferWebPort` interface defined in same directory
- [ ] **FMC-04**: `MockSaferWebAdapter` returns realistic fake data (legalName, dba, address, dotNumber, fleetSize, safetyRating, authorityStatus, officerName)
- [ ] **FMC-05**: `fmcsaSnapshot: Json?` field added to `OnboardingSession`
- [ ] **FMC-06**: Engine handler for `verification` step type waits for `fmcsa.completed` ExternalEvent before advancing
- [ ] **FMC-07**: Schema integration — `prefillFrom: { source: 'fmcsa', field: 'legalName' }` works against `fmcsaSnapshot`
- [ ] **FMC-08**: UI verification step shows "Looking up your authority…" spinner; advances on event arrival
- [ ] **DOC-04**: ADR-003 at `docs/adrs/` — "FMCSA integration via SaferWebPort + adapter pattern; mock first, real later"

## v2 Requirements

Tracked but deferred per §7 of the implementation plan; revisit when the trigger fires.

### Schema & Engine

- **V2-SCH-01**: JSON-stored schema + version pinning — revisit when non-engineer needs to edit flows, or in-flight migrations become a real problem
- **V2-ENG-01**: Full command/result decomposition for save logic — revisit when service-layer test pain becomes painful

### Observability

- **V2-OBS-01**: Event sourcing / `OnboardingEvent` log — revisit when carrier dispute requires session replay, or legal review demands it
- **V2-OBS-02**: Session abandonment watchdog — revisit when abandoned sessions exceed 20% rate

### Signing

- **V2-SIGN-01**: DocuSeal migration — revisit when legal review requires audit certificate, or base64 signing causes a real dispute

### Real-Time Features (consume Phase 4)

- **V2-RT-01**: Live eligibility sidebar — revisit when Sales/UX commits; Phase 4 must be done first
- **V2-RT-02**: Co-pilot bidirectional editing — **deferred indefinitely**; revisit when real support workflow demands it
- **V2-RT-03**: Dispatcher dashboard real-time updates — revisit when dispatchers complain about staleness; Phase 4 must be done first

### FMCSA

- **V2-FMC-01**: Real SaferWebAPI integration — revisit when provider contract + pricing signed
- **V2-FMC-02**: 24-hour Redis cache for FMCSA snapshots — lands with real adapter
- **V2-FMC-03**: Background retry job for failed FMCSA lookups — lands with real adapter

### Carrier Identity & Entry

- **V2-AUTH-01**: Carrier Cognito provisioning — revisit when post-onboarding carrier portal becomes a real use case
- **V2-ENT-01**: Self-registration entry point — revisit when sales pipeline supports unsolicited inbound

### Document Handling

- **V2-DOC-01**: Document OCR (Textract) — revisit when manual review volume becomes unmanageable

## Out of Scope

Explicitly excluded. Includes prior rejections that must not be relitigated.

| Feature | Reason |
|---------|--------|
| Outbox pattern | **Explicitly rejected.** Events publish inline as today. Reject again unless real event-loss incident occurs. |
| Greenfield rewrite | Decision locked: incremental refactor toward tech-spec patterns; preserve working code. |
| Parallel-stack maintenance / feature flags | Dev mode permits replace-in-place; no parallel-stack overhead needed. |
| Phases run in parallel | Solo engineer; sequential phases only with clean exit criteria. |
| Real SaferWebAPI calls during scaffold | Phase 5 ships with `MockSaferWebAdapter` only. Real integration requires signed contract. |
| Live eligibility sidebar in Phase 4 | Phase 4 ships an empty pipe + smoke feature only. Live features ship later. |

## Traceability

Populated during roadmap creation by the gsd-roadmapper agent.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STAB-01..STAB-15 | TBD | Pending |
| SEC-01..SEC-04 | TBD | Pending |
| SCH-01..SCH-08 | TBD | Pending |
| ENG-01..ENG-07 | TBD | Pending |
| INT-01..INT-02 | TBD | Pending |
| DOC-01..DOC-02 | TBD | Pending |
| SIGN-01..SIGN-08 | TBD | Pending |
| WS-01..WS-08 | TBD | Pending |
| DOC-03 | TBD | Pending |
| FMC-01..FMC-08 | TBD | Pending |
| DOC-04 | TBD | Pending |

**Coverage:**
- v1 requirements: 58 total
- Mapped to phases: 0 (roadmap not yet created)
- Unmapped: 58 ⚠️ (will resolve after roadmap)

---
*Requirements defined: 2026-05-13*
*Last updated: 2026-05-13 after initial definition*
