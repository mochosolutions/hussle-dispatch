# Phase 1: Stabilize — CONTEXT

> User skipped discussion. Phase 1 is heavily pre-specified by the implementation plan and 15 STAB requirements — most decisions are already locked. Downstream agents (researcher, planner) should treat the canonical refs below as authoritative.

<domain>
Existing 6-phase carrier onboarding flow works end-to-end without intervention. Fix the broken Save & Continue chain, surface validation errors, build the missing cost-analysis + lane-preferences phases, and land a Playwright e2e safety net so subsequent phases (especially Phase 3's engine refactor) can refactor against a green test.
</domain>

<canonical_refs>
Downstream agents MUST read these before planning. Every ref is a relative path from repo root.

**Authoritative plan + locked requirements:**
- `docs/carrier-onboarding-implementation-plan.md` — source of truth for the 6-phase refactor; Phase 1 ("Stabilize") section is locked
- `.planning/PROJECT.md` — locked decisions, constraints, known bugs (lines 156–166 enumerate the 5 traffic-blocking bugs Phase 1 fixes)
- `.planning/REQUIREMENTS.md` — STAB-01 through STAB-15 (lines 14–28) with file:line precision
- `.planning/ROADMAP.md` — Phase 1 success criteria

**Design sources for the missing UI:**
- `.planning-legacy/carrier-onboarding/designs/interview-cost-analysis.md` — referenced by STAB-06 for `costAnalysisQuestions.ts`; also drives STAB-07 (PresetTileSelector) and STAB-08 (CostResultCard)
- `.planning-legacy/carrier-onboarding/designs/interview-shell.md` — shell/portal UX patterns
- `.planning-legacy/carrier-onboarding/designs/cost_analysis_complete.png` — visual reference for CostResultCard
- `.planning-legacy/carrier-onboarding/` — full legacy artifact set; authoritative for what shipped in the validated Phase 1 backend

**Codebase entry points (file:line refs from REQUIREMENTS.md):**
- `hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx` — `handleSubmit` at L76 (STAB-01), `sessionCompleted` dispatch at L81–83 (STAB-03), hardcoded phase list at L25 (STAB-04)
- `hussle-app-dispatch-ui/src/features/carrier-portal/components/PortalLayout/index.tsx` — hardcoded phase list at L18 (STAB-04)
- `hussle-app-dispatch-ui/src/features/carrier-portal/store/carrierPortalSlice.ts` — `setCurrentPhase` silent guard at L95–99 (STAB-05)
- `hussle-app-dispatch-ui/src/features/carrier-portal/questions/` — `companyQuestions.ts`, `equipmentQuestions.ts`, `driversQuestions.ts`, `documentsQuestions.ts` exist; `costAnalysisQuestions.ts` + `lanePreferencesQuestions.ts` are missing (STAB-06, STAB-09)
- `hussle-app-dispatch-ui/src/components/ConversationalForm/InputRenderer.tsx` — needs `presetTiles` + `stateGrid` cases (STAB-12); `SubQuestion.tsx` + `SubAnswer.tsx` already exist
- `hussle-app-dispatch-ui/src/features/carrier-portal/components/PresetTileSelector/` — folder exists (STAB-07: verify component is complete vs needs finishing)
- `hussle-app-dispatch-ui/src/features/carrier-portal/components/StateGrid/` — folder exists (STAB-10: same)
- `hussle-app-dispatch-ui/e2e/` — `driver-portal-smoke.spec.ts` is the existing Playwright pattern to mirror for STAB-14
- `hussle-app-dispatch-ui/playwright.config.ts` — config the new e2e plugs into

**Recently deleted (must rebuild per design refs above):**
- `hussle-app-dispatch-ui/src/features/carrier-portal/components/CostResultCard/index.tsx` (deleted — STAB-08)
- `hussle-app-dispatch-ui/src/features/carrier-portal/questions/costAnalysisQuestions.ts` (deleted — STAB-06)

**Codebase maps already produced:**
- `.planning/codebase/ARCHITECTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `STRUCTURE.md`, `STACK.md`, `CONCERNS.md`, `INTEGRATIONS.md`
</canonical_refs>

<locked_requirements>
All 15 STAB requirements are locked. Listed verbatim from `.planning/REQUIREMENTS.md` (do not re-derive):

- **STAB-01** — `handleSubmit` dispatches phase-save; phase advance moves to `useEffect` watching save-success state
- **STAB-02** — Validation errors surfaced via notistack snackbar; UI scrolls to first error field
- **STAB-03** — Final-phase logic dispatches `completeOnboarding` (API), not local-only `sessionCompleted`
- **STAB-04** — Phase metadata extracted to `features/carrier-portal/constants.ts`; consumed by both `CarrierPortalPage` and `PortalLayout`
- **STAB-05** — `setCurrentPhase` reducer no longer silently guards on `if (state.session)`
- **STAB-06** — `costAnalysisQuestions.ts` built per legacy interview-cost-analysis.md design
- **STAB-07** — `PresetTileSelector` component (pill-shaped chips + custom-value option)
- **STAB-08** — `CostResultCard` component (dark-bg full-screen, animated count-up, break-even RPM + minimum booking rate)
- **STAB-09** — `lanePreferencesQuestions.ts` built
- **STAB-10** — `StateGrid` component (50-state clickable grid with preference cycling: preferred / avoided / neutral)
- **STAB-11** — `SubQuestion` + `SubAnswer` components with colored left borders (blue/green/red/grey)
- **STAB-12** — `presetTiles` and `stateGrid` cases added to `InputRenderer`
- **STAB-13** — `PHASE_LABELS` and `TOTAL_PHASES` expanded to 6 phases
- **STAB-14** — Playwright e2e: invite → portal → all 6 phases → submit → approve; green in CI
- **STAB-15** — Manual smoke test of the full 6-phase flow

Success exit criteria per `.planning/ROADMAP.md` Phase 1.
</locked_requirements>

<decisions>
No user-supplied decisions captured this session — user opted to skip discussion and proceed directly to planning. All implementation choices below are pre-locked by the plan + REQUIREMENTS.md + PROJECT.md "Key Decisions" table.

**Locked from PROJECT.md / implementation plan:**
- Tech stack: React 18 + MUI v5 + Redux Toolkit + Redux Saga + Yup + Formik (UI); no thunks
- Migration posture: replace in place (dev mode, no production carriers yet)
- No backwards-compatibility shims, no feature flags
- Phase ships sequentially before Phase 2 begins; hard exit criterion is `STAB-14` green in CI + `STAB-15` manual smoke passing
- Playwright is the safety net the rest of the project relies on — Phase 3's engine refactor uses it as the regression gate
- No `Co-Authored-By` in commits
</decisions>

<deferred>
Anything outside Phase 1 scope. Specifically NOT in this phase:
- Token hashing, EIN encryption — Phase 2
- Schema-as-data + pure-function engine — Phase 3
- Mid-flow signing + field locking — Phase 4
- WebSocket scaffold — Phase 5
- FMCSA scaffold — Phase 6
</deferred>

<open_for_research>
Researcher / planner should investigate and decide (user declined to pre-decide):

1. **Save → advance signal mechanism** — STAB-01 says "phase advance moves to a `useEffect` watching save-success state." Existing carrier-portal slice patterns will dictate whether this is a one-shot success flag (cleared on consumption), a saga `take`-based imperative chain, or a per-action callback pattern. Match what's already in the slice's loading-map convention; don't invent a new pattern.

2. **Cost analysis calc location** — STAB-08 needs break-even RPM + minimum booking rate. Default to UI-side pure JS in the component/schema (no new API endpoint) — matches `.planning/PROJECT.md` "schema is data, stored as code first" constraint. Confirm formula source from `.planning-legacy/carrier-onboarding/designs/interview-cost-analysis.md`.

3. **Playwright e2e environment** — STAB-14 must run "in CI." Repo already has `Jenkinsfile.build` and `Jenkinsfile.deploy`. Pattern after the existing `driver-portal-smoke.spec.ts` in `hussle-app-dispatch-ui/e2e/`. Test-data strategy: prefer seeded test DB + real API over MSW (consistent with the rest of the project), but confirm against existing Playwright config.

4. **PresetTileSelector / StateGrid completeness** — folders exist but git status doesn't show them as modified-recent; planner should verify whether they need to be built from scratch or finished/wired into `InputRenderer`.

5. **STAB-15 deliverable form** — manual smoke test: planner decides whether this is a committed checklist doc, a Playwright reproduction, or a verbal sign-off log entry.
</open_for_research>

<code_context>
- 4 of 6 carrier-portal phase modules already exist (`companyQuestions.ts`, `equipmentQuestions.ts`, `driversQuestions.ts`, `documentsQuestions.ts`). Cost analysis + lane preferences are the additions.
- `ConversationalForm/InputRenderer.tsx` is the central switch — extending it follows an established pattern.
- `SubQuestion.tsx` and `SubAnswer.tsx` already exist in `ConversationalForm/` — STAB-11 is verify/finish, not from-scratch.
- `PresetTileSelector/` and `StateGrid/` component folders exist — STAB-07 and STAB-10 may be partial.
- `e2e/driver-portal-smoke.spec.ts` is the Playwright pattern to mirror for STAB-14.
- Redux store: dual-slice pattern (page slice + entity slice). Carrier-portal uses `carrierPortalSlice.ts` and follows the loading-map / saga / no-thunks convention documented in `CLAUDE.md`.
- No `@mocho/ui` shared package — that section of project CLAUDE.md is stale.
</code_context>

<notes>
- Session opted out of discussion at the first AskUserQuestion. Five gray areas were identified but not selected: (1) cost analysis calc location, (2) Playwright posture, (3) save→advance + validation UX wiring, (4) STAB-15 deliverable form, (5) PresetTileSelector/StateGrid completion status. They are listed under `<open_for_research>` for the researcher and planner to resolve.
- Phase 1 has unusually high specification density (file:line refs in REQUIREMENTS.md) — the planner should produce a task list that maps 1:1 to STAB-01..STAB-15 rather than re-derive scope.
</notes>
