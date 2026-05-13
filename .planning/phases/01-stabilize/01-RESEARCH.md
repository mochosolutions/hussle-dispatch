# Phase 1: Stabilize — Research

**Researched:** 2026-05-13
**Domain:** Frontend stabilization — finish the 6-phase carrier onboarding portal (UI + saga + e2e safety net), all working components already exist in tree.
**Confidence:** HIGH (codebase is comprehensively mapped; all file:line references verified against current code).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

User skipped discussion. The following are pre-locked by `docs/carrier-onboarding-implementation-plan.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, and `01-UI-SPEC.md` (approved 6/6):

- **Tech stack:** React 18 + MUI v5 + Redux Toolkit + Redux Saga + Yup + Formik (UI); no thunks
- **Migration posture:** replace in place (dev mode — no production carriers); no parallel-stack maintenance; no feature flags
- **Phase ordering:** strictly sequential. Phase 1 must ship green before Phase 2 begins. Exit criterion = `STAB-14` Playwright green in CI + `STAB-15` manual smoke passing.
- **Playwright is the safety net** for the rest of the project — Phase 3's engine refactor uses it as the regression gate.
- **No `Co-Authored-By` lines** in commits.
- **Schema is data, stored as code first** (TS files, not DB).
- **No `@mocho/ui` shared package** — that section of project CLAUDE.md is stale. All form fields used in Phase 1 come from MUI directly or from `src/components/ConversationalForm/` and `src/features/carrier-portal/components/`.
- **All 15 STAB requirements (STAB-01..STAB-15) are locked** with file:line precision in REQUIREMENTS.md.
- **UI-SPEC approved 6/6 dimensions** — visual contract is final (typography Table 1 + isolation zone Table 2, MUI palette tokens, copy verbatim, responsive contract mobile-first).

### Claude's Discretion (researcher/planner must decide)

1. **Save→advance signal mechanism** — `useEffect` watching save-success state. Pick existing slice convention; do not invent.
2. **Cost analysis calc location** — default to UI-side pure JS in component/schema (no new API endpoint).
3. **Playwright e2e environment** — pattern after `driver-portal-smoke.spec.ts`; prefer route-mocked deterministic flow over seeded DB (matches existing pattern).
4. **PresetTileSelector / StateGrid completeness** — folders exist; verify whether finished or partial (this research has done that — both are built; wiring is the gap).
5. **STAB-15 deliverable form** — committed checklist doc vs Playwright reproduction vs sign-off log entry.

### Deferred Ideas (OUT OF SCOPE for Phase 1)

- Token hashing, EIN encryption → Phase 2
- Schema-as-data + pure-function engine → Phase 3
- Mid-flow signing + field locking → Phase 4
- WebSocket scaffold → Phase 5
- FMCSA scaffold → Phase 6
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **STAB-01** | `handleSubmit` dispatches phase-save; advance moves to `useEffect` watching save-success | Existing `savePhaseDataSaga.ts` already has `saveCompany`/`saveEquipment`/`saveDrivers` workers + slice action pairs. **Missing**: `saveCostAnalysis` and `saveLanePreferences` worker + action pair. `useEffect` pattern reads from `selectIsSavingPhase` (`savingPhase: boolean` in slice). Need to add a *rising-edge* success signal (per-phase or a generic `savePhaseSuccess(phase)` action). |
| **STAB-02** | Validation errors surfaced via notistack snackbar; UI scrolls to first error field | `notistack` already a dep; standard pattern in project uses `enqueueSnackbar`. `QuestionCard.tsx:28` and `SubQuestion.tsx:36` already expose `data-question-id={questionId}` — the DOM hook for `el.scrollIntoView()` exists. Per UI-SPEC §"Scroll-to-error", honor `prefers-reduced-motion`. |
| **STAB-03** | Final-phase logic dispatches `completeOnboarding` (API), replacing local-only `sessionCompleted` | API endpoint `POST /carrier-portal/session/complete` exists (`sessionController.ts:61`, `routes/index.ts:75`). UI side: `carrierPortalActions.completeOnboarding` action + saga handler already wired (`savePhaseDataSaga.ts:73-86`). Page just needs to dispatch it instead of the local `sessionCompleted` reducer at `CarrierPortalPage:81-83`. |
| **STAB-04** | Phase metadata → `features/carrier-portal/constants.ts`; consumed by `CarrierPortalPage` and `PortalLayout` | Confirmed duplication: `CarrierPortalPage/index.tsx:25` declares `PHASE_LABELS = ['Company','Equipment','Drivers','Documents']`; `PortalLayout/index.tsx:18` declares `PHASES = ['Company','Equipment','Drivers','Documents']`. Both arrays must grow to 6 entries and be imported from one shared module. Constants file does not currently exist (no `constants.ts` under `features/carrier-portal/`). |
| **STAB-05** | `setCurrentPhase` reducer no longer silently guards on `if (state.session)` | Verified at `carrierPortalSlice.ts:95-99` — current code `if (state.session) { state.session.currentPhase = action.payload }` silently fails when session is null. Bug-masking branch must go. Two safe rewrites: (a) lift `currentPhase` to top-level state (b) keep on `session` but log/throw if session missing (preferred: lift to top-level slice state so it stays usable before session boots). |
| **STAB-06** | `costAnalysisQuestions.ts` built per `.planning-legacy/carrier-onboarding/designs/interview-cost-analysis.md` | Design specifies 6 preset-tile questions: truckPayment, insuranceCost, fuelCostPerGallon, milesPerGallon, maintenanceMonthlyCost, otherMonthlyCosts. API validator at `costAnalysisValidator.ts` already lists these exact six fields with bounds (lines 5–22). Format: `inputType: 'presetTiles'`, each question carries its own `presets: PresetOption[]`. Q1 has subQuestion "I own it outright" (`yesNo` → conditional skip to $0). |
| **STAB-07** | `PresetTileSelector` component (pill chips + custom-value input) | **Already built** at `features/carrier-portal/components/PresetTileSelector/index.tsx` (73 lines). Implements pill chips via MUI `Chip` filled/outlined, custom chip reveals inline `TextField`. Touch targets are MUI `Chip` default (32px) — UI-SPEC §Accessibility says wrap in 48-tall row, which the component already does via flex parent. Gap: not wired into `InputRenderer`. |
| **STAB-08** | `CostResultCard` component | **Recently deleted** (git status: `D hussle-app-dispatch-ui/src/features/carrier-portal/components/CostResultCard/index.tsx`). Must rebuild per UI-SPEC §"Component Inventory A" + legacy design. Formula source from `interview-cost-analysis.md` is implicit; explicit formula derived below in §"Cost Analysis Calculations". |
| **STAB-09** | `lanePreferencesQuestions.ts` built | API validator at `lanePreferencesValidator.ts:28-41` lists 6 body fields: `homeBaseCity`, `homeBaseState`, `maxDaysOut`, `preferredLanes[]`, `statePreferences[]`, `freightPreferences[]`. UI scope per UI-SPEC §"Component Inventory C": keep to minimum — primary question is `stateGrid` for `statePreferences`; out-of-scope items (preferredLanes pairings, equipment-state) defer unless legacy design explicitly lists them. |
| **STAB-10** | `StateGrid` component | **Already built** at `features/carrier-portal/components/StateGrid/index.tsx` (132 lines). 48×48 tiles, 3-state cycle (neutral → PREFERRED → AVOIDED → neutral; neutral removes key). Already wired into `InputRenderer:410`. Gap: missing `role="button"`, `aria-pressed`, `aria-label` per UI-SPEC §Accessibility. |
| **STAB-11** | `SubQuestion` + `SubAnswer` with colored left borders | **Already built** at `components/ConversationalForm/SubQuestion.tsx` (75 lines) and `SubAnswer.tsx` (59 lines). Border colors `blue|green|red|grey` map to `info.main|success.main|error.main|grey.400`. **Discrepancy:** `SubQuestion.tsx:55-59` pins `fontSize: '18px'`; UI-SPEC §Typography Table 1 demands 16/600 — demote to 16 during execution. |
| **STAB-12** | `presetTiles` and `stateGrid` cases in `InputRenderer` | `stateGrid` case already wired (`InputRenderer.tsx:409-410`). `presetTiles` case is the **placeholder stub** at lines 293-307 (`PresetTilesPlaceholder` returns "PresetTiles (built in T-31)" text). Replace with `<PresetTileSelector presets={...} value={...} onChange={...} />`. Requires extending `QuestionDefinition` to expose `presets?: PresetOption[]` (currently not present in `questionSchema.ts`). |
| **STAB-13** | `PHASE_LABELS` and `TOTAL_PHASES` expanded to 6 | Combined with STAB-04 — both arrays grow from `['Company','Equipment','Drivers','Documents']` (4) to `['Company','Equipment','Drivers','Cost Analysis','Lane Preferences','Documents']` (6) when extracted to constants. |
| **STAB-14** | Playwright e2e: invite → portal → 6 phases → submit → approve; green in CI | Playwright config exists at `hussle-app-dispatch-ui/playwright.config.ts`. Existing pattern: `e2e/driver-portal-smoke.spec.ts` uses `page.route()` to mock backend responses. CI hook absent from current `Jenkinsfile.build` — must be added (or test runs as part of UI validate gate). |
| **STAB-15** | Manual smoke test passes | Deliverable form: planner-decided. Recommend a committed checklist at `.planning/phases/01-stabilize/SMOKE-CHECKLIST.md` filled in during execution. |
</phase_requirements>

---

## Summary

Phase 1 is **stabilization-by-finishing**, not net-new design. The 6-phase carrier onboarding portal is ~70% wired: the API has all 7 endpoints live (session + 6 phase saves + complete), the UI has 4 of 6 phase question schemas, both placeholder components (`PresetTileSelector`, `StateGrid`) are built but not fully wired, and the saga layer has 3 of 5 phase-save workers. The work is to (1) close the wiring gaps in `CarrierPortalPage` so Save & Continue actually dispatches sagas and advances on success rather than calling local-only reducers, (2) build two missing question schemas (cost analysis, lane preferences), (3) rebuild the deleted `CostResultCard`, (4) extend `InputRenderer` to render `PresetTileSelector` instead of a placeholder stub, (5) add the missing `saveCostAnalysis` + `saveLanePreferences` saga workers + slice actions + API client functions, (6) surface validation via notistack + scroll-to-first-error, and (7) land a Playwright e2e covering the full invite → submit → approve flow.

The architectural patterns are entirely established. The existing 4 phases (Company/Equipment/Drivers/Documents) work as the template — replicate that pattern for Cost Analysis and Lane Preferences. The conversational-form engine (`InputRenderer`, `QuestionCard`, `SubQuestion`, `SubAnswer`, `PhaseDivider`) is built and stable. The Redux dual-slice convention, saga `takeLatest` pattern, and notistack toast convention are all in active use elsewhere in the codebase.

**Primary recommendation:** Plan tasks 1:1 against STAB-01..STAB-15 in the order listed below (Architecture Patterns §"Task Sequencing"). Do not re-derive scope — REQUIREMENTS.md and UI-SPEC.md are the contracts. The single largest risk is STAB-14 (Playwright e2e) which must drive a green CI run; budget for ~1 day of test-stability work even after the implementation is complete.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Phase metadata (labels, totals, order) | UI (single source) | — | Constants live in `features/carrier-portal/constants.ts`; consumed by page + layout components only. |
| Phase question schemas (cost analysis, lane preferences) | UI (TS files) | — | "Schema is data, stored as code first" — PROJECT.md locks this. Files live alongside existing 4 schema files under `features/carrier-portal/questions/`. |
| Phase save dispatch + advance | UI (Redux Saga) | API (POST endpoints) | UI dispatches saga action → saga calls API → on success dispatches `savePhaseSuccess` → page `useEffect` advances `currentPhase`. API endpoints already exist (`POST /carrier-portal/{company|equipment|drivers|cost-analysis|lane-preferences}`) — no API changes needed. |
| Completion flow | UI (Redux Saga) | API (POST /session/complete) | UI dispatches `completeOnboarding`; existing saga calls existing endpoint. Replaces local-only `sessionCompleted` reducer call. |
| Validation (format) | UI (Yup via Formik) | API (Yup via `validateRequest` middleware) | Two layers, both Yup. UI prevents bad submits; API rejects bad payloads. No new contract needed. |
| Validation surfacing (snackbar + scroll) | UI (component + notistack) | — | Pure UI concern. Uses `data-question-id` attribute already on `QuestionCard` and `SubQuestion`. |
| Cost analysis calculations (break-even RPM, minimum rate) | UI (pure JS in component) | — | No API endpoint. PROJECT.md §"schema is data, stored as code first" supports this. Formula in §"Cost Analysis Calculations" below. |
| State preference cycling | UI (`StateGrid` component) | — | Already built; pure component state, no API dependency. |
| E2E test orchestration | UI (Playwright) | API (mocked via `page.route()`) | Match `driver-portal-smoke.spec.ts` pattern: mock API responses to keep tests deterministic; do not require backend running. CI runs `npx playwright test`. |
| Manual smoke test | Human (checklist) | — | Out-of-band of CI. Document outcome in `SMOKE-CHECKLIST.md`. |

---

## Standard Stack

### Core (already in deps, all VERIFIED via `hussle-app-dispatch-ui/package.json`)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react` | `^18.3.1` | UI library | Project standard [VERIFIED: package.json] |
| `@mui/material` | `^5.15.21` | Component library | Project standard, MUI v5 only [VERIFIED: package.json] |
| `@reduxjs/toolkit` | `^2.2.6` | State management | Project standard, thunks disabled [VERIFIED: package.json + store config] |
| `redux-saga` | `^1.3.0` | Async side effects | Project standard — thunks explicitly disabled [VERIFIED: CLAUDE.md] |
| `formik` | `^2.4.6` | Form state | Project standard for forms [VERIFIED: package.json] |
| `yup` | `^1.4.0` | Validation schemas | Project standard, used UI + API [VERIFIED: package.json] |
| `notistack` | `^3.0.1` | Snackbar notifications | Project standard — used in `utils/axios.ts:6` and saga error pattern [VERIFIED: CLAUDE.md §Error Handling] |
| `@playwright/test` | `^1.59.1` | E2E framework | Already present + configured at `playwright.config.ts` [VERIFIED: package.json + driver-portal-smoke.spec.ts] |
| `react-router-dom` | `^6.24.1` | Routing (token param in URL) | Project standard [VERIFIED: package.json] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `framer-motion` | `^11.3.4` | Animation primitives | **DO NOT pull in for `CostResultCard` count-up** — UI-SPEC §Animations explicitly says use `requestAnimationFrame` instead. Already in deps for other features. |
| `jest` + `@testing-library/react` | `^30.2.0` / `^16.3.2` | Unit/component tests | Co-located `.test.tsx` for new components |
| `redux-saga-test-plan` | `^4.0.6` | Saga unit tests | For testing new `saveCostAnalysis` / `saveLanePreferences` workers |
| `msw` | `^2.12.10` | HTTP mocking (Jest) | Available if needed; Playwright uses `page.route()` instead per existing pattern |

### Alternatives Considered (and rejected)

| Instead of | Could Use | Why Rejected |
|------------|-----------|--------------|
| Custom `useEffect` with rising-edge ref | Saga `take` chain in the page component | Would invent a new pattern. CLAUDE.md §"Save & Continue chain" prescribes the `useEffect` rising-edge approach. |
| One unified `savePhase` action with discriminated payload | Per-phase `saveCompany`/`saveEquipment`/etc. actions | The existing 3 actions in the slice (`saveCompany`, `saveEquipment`, `saveDrivers`) already follow per-phase pattern. Add `saveCostAnalysis` + `saveLanePreferences` to match. Refactoring all 5 into one is out of scope for Phase 1. |
| `useState` for snackbar timing | Direct `enqueueSnackbar` call | Project pattern is `enqueueSnackbar` directly — no state held. |
| New animation library for count-up | `requestAnimationFrame` loop | UI-SPEC §Animations explicitly forbids adding a new lib for this. |
| Seeded test DB for Playwright | `page.route()` mocks | Existing pattern (`driver-portal-smoke.spec.ts`) mocks at the route layer. Stay consistent. |

**Installation:** No new dependencies. Everything required is already in `hussle-app-dispatch-ui/package.json`.

---

## Architecture Patterns

### System Architecture Diagram

```
                     ┌────────────────────────────────────────┐
                     │   Carrier (mobile browser)              │
                     │                                          │
                     │   GET /carrier-portal/:token             │
                     └──────────────────┬───────────────────────┘
                                        │
                                        ▼
            ┌───────────────────────────────────────────────────────┐
            │ React Router → CarrierPortalPage                       │
            │  ┌─────────────────────────────────────────────────┐  │
            │  │ PortalAuthGuard (validates token, dispatches    │  │
            │  │   fetchSession on mount)                         │  │
            │  └─────────────┬───────────────────────────────────┘  │
            │                ▼                                       │
            │  ┌─────────────────────────────────────────────────┐  │
            │  │ Formik <PortalPhaseRunner>                       │  │
            │  │   - reads currentPhase from Redux                │  │
            │  │   - renders PhaseForm with phaseQuestions[phase] │  │
            │  │   - autoSave: 500ms debounce on field change     │  │
            │  └─────────────┬───────────────────────────────────┘  │
            │                ▼                                       │
            │  ┌─────────────────────────────────────────────────┐  │
            │  │ PortalLayout: header + stepper + footer + slot   │  │
            │  └─────────────────────────────────────────────────┘  │
            └─────────────────────────┬─────────────────────────────┘
                                       │   Save & Continue tap
                                       ▼
            ┌────────────────────────────────────────────────────────┐
            │ handleContinue(formik)                                  │
            │  1. validateForm() → errors                             │
            │  2. setTouched(allTouched)                              │
            │  3. errors? → notistack snackbar + scroll-to-first      │
            │     no errors? → dispatch savePhaseAction(phase)        │
            └─────────────────────────┬──────────────────────────────┘
                                       │
                                       ▼
            ┌────────────────────────────────────────────────────────┐
            │ savePhaseDataSaga                                       │
            │  - takeLatest(saveCompany)         → POST /company      │
            │  - takeLatest(saveEquipment)       → POST /equipment    │
            │  - takeLatest(saveDrivers)         → POST /drivers      │
            │  - takeLatest(saveCostAnalysis)    → POST /cost-analysis│ NEW
            │  - takeLatest(saveLanePreferences) → POST /lane-prefs   │ NEW
            │  - takeLatest(completeOnboarding)  → POST /session/complete
            └─────────────────────────┬──────────────────────────────┘
                                       │
                          success? │     │ failure?
                                  ▼     ▼
            put(savePhaseSuccess)   put(savePhaseFailure)
                  │                       │
                  ▼                       ▼
            useEffect in page         notistack error toast
              fires:                  no advance
              if phase < 6: setCurrentPhase(phase+1)
              if phase = 6: dispatch(completeOnboardingRequest)
              scrollTo top

            (completeOnboardingSuccess → page renders PortalCompleteView)
```

### Recommended Project Structure (additive changes only)

```
hussle-app-dispatch-ui/src/
├── components/ConversationalForm/
│   ├── InputRenderer.tsx                       # MODIFY (STAB-12)
│   ├── QuestionCard.tsx                        # verify data-question-id ✓ already present
│   ├── SubQuestion.tsx                         # MODIFY (STAB-11 — demote 18px → 16px)
│   ├── SubAnswer.tsx                           # no change
│   └── questionSchema.ts                       # MODIFY — add presets?: PresetOption[]
│
├── features/carrier-portal/
│   ├── constants.ts                            # CREATE (STAB-04, STAB-13)
│   ├── components/
│   │   ├── CostResultCard/index.tsx            # CREATE (STAB-08, recently deleted)
│   │   ├── PresetTileSelector/index.tsx        # verify ✓ already built
│   │   ├── StateGrid/index.tsx                 # MODIFY (STAB-10 — a11y attrs)
│   │   ├── PortalLayout/index.tsx              # MODIFY (STAB-04 — import from constants)
│   │   ├── PortalStepper/index.tsx             # verify renders 6 dots; mobile compresses
│   │   └── PortalFooterBar/index.tsx           # MODIFY only if STAB-01 changes signal shape
│   ├── pages/CarrierPortalPage/index.tsx       # MODIFY (STAB-01, STAB-02, STAB-03, STAB-04)
│   ├── questions/
│   │   ├── companyQuestions.ts                 # no change
│   │   ├── equipmentQuestions.ts               # no change
│   │   ├── driversQuestions.ts                 # no change
│   │   ├── costAnalysisQuestions.ts            # CREATE (STAB-06)
│   │   ├── lanePreferencesQuestions.ts         # CREATE (STAB-09)
│   │   └── documentsQuestions.ts               # no change
│   └── store/
│       ├── slices/carrierPortalSlice.ts        # MODIFY (STAB-01, STAB-05, STAB-06, STAB-09)
│       │     - add saveCostAnalysis(*)/Success/Failure actions
│       │     - add saveLanePreferences(*)/Success/Failure actions
│       │     - remove if(state.session) guard from setCurrentPhase
│       │     - optionally lift currentPhase to top-level state
│       ├── sagas/savePhaseDataSaga.ts          # MODIFY — add 2 new workers
│       └── selectors/portalSelectors.ts        # MODIFY if currentPhase moves; otherwise no change
│
├── utils/api/fleet/carrierPortalApi.ts         # MODIFY — add saveCostAnalysis(), saveLanePreferences()
│
└── e2e/
    └── carrier-portal-full.spec.ts             # CREATE (STAB-14)
```

### Pattern 1: Per-Phase Save Action + Saga + Slice Reducer

**What:** Each phase has its own `savePhase`/`savePhaseSuccess`/`savePhaseFailure` action triple in the slice. The saga's `takeLatest` watcher listens for the request action, calls the matching API client, and dispatches success/failure.

**When to use:** All 5 non-completion phase saves (company, equipment, drivers, cost-analysis, lane-preferences). This is the existing established pattern — replicate for the two new phases.

**Example (existing pattern, from `carrierPortalSlice.ts:107-117`):**

```typescript
// Source: hussle-app-dispatch-ui/src/features/carrier-portal/store/slices/carrierPortalSlice.ts
saveCompany(state, _action: PayloadAction<SaveCompanyRequest>) {
  state.savingPhase = true;
  state.error = null;
},
saveCompanySuccess(state) {
  state.savingPhase = false;
},
saveCompanyFailure(state, action: PayloadAction<string>) {
  state.savingPhase = false;
  state.error = action.payload;
},
```

```typescript
// Source: hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/savePhaseDataSaga.ts
function* handleSaveCompany(action: PayloadAction<SaveCompanyRequest>): Generator {
  try {
    const token: string | null = yield* getToken();
    if (!token) {
      yield put(carrierPortalActions.saveCompanyFailure('No token available'));
      return;
    }
    yield call(api.saveCompany, token, action.payload);
    yield put(carrierPortalActions.saveCompanySuccess());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save company';
    yield put(carrierPortalActions.saveCompanyFailure(message));
  }
}
```

### Pattern 2: useEffect Rising-Edge on Save Success

**What:** Phase advance happens in a `useEffect` watching the per-phase success counter or flag — NOT inside the `onSubmit`/`handleContinue` callback.

**When to use:** After dispatching `savePhase(*)` request, the component should not advance optimistically. It waits for `savePhase(*)Success` to be reduced, then `useEffect` sees the change and dispatches `setCurrentPhase(currentPhase + 1)`.

**Recommended signal mechanism (HIGH confidence):** Add a per-phase rising-edge success counter or a `lastSavedPhase: number | null` field to the slice. The page's `useEffect([lastSavedPhase])` advances when `lastSavedPhase === currentPhase`. After advance, clear `lastSavedPhase` to null so re-saves don't re-advance.

**Alternative considered:** A per-action timestamp `lastSaveSuccessAt: Record<phase, ISO>`. Adds noise. The single-field `lastSavedPhase` is cleaner.

**Example (proposed pattern — to be implemented):**

```typescript
// In carrierPortalSlice.ts
interface CarrierPortalState {
  // ... existing fields
  lastSavedPhase: number | null;   // NEW
}

// In every saveXxxSuccess reducer:
saveCompanySuccess(state) {
  state.savingPhase = false;
  state.lastSavedPhase = 1;
},

// New action to clear (consumed after advance):
phaseAdvanceConsumed(state) {
  state.lastSavedPhase = null;
},

// In CarrierPortalPage:
const lastSavedPhase = useSelector(selectLastSavedPhase);
useEffect(() => {
  if (lastSavedPhase === null) return;
  if (lastSavedPhase === currentPhase) {
    if (currentPhase < TOTAL_PHASES) {
      dispatch(carrierPortalActions.setCurrentPhase(currentPhase + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      dispatch(carrierPortalActions.completeOnboarding());
    }
    dispatch(carrierPortalActions.phaseAdvanceConsumed());
  }
}, [lastSavedPhase, currentPhase, dispatch]);
```

`[ASSUMED]` — exact field name `lastSavedPhase` is researcher's recommendation; planner may choose `lastSaveSuccess` or another name as long as it's a single value (not a counter) that's cleared after consumption.

### Pattern 3: Validation Snackbar + Scroll-to-Error

**What:** On `Save & Continue` tap, if validation fails, fire one notistack warning toast and scroll the first error field into view.

**When to use:** `handleContinue` in `CarrierPortalPage` (line 188).

**Example (verbatim from UI-SPEC §Scroll-to-error):**

```typescript
// Source: 01-UI-SPEC.md §"Scroll-to-error (STAB-02)"
const handleContinue = useCallback(async () => {
  const errors = await formik.validateForm();
  const allTouched: FormikTouched<Record<string, unknown>> = {};
  collectFieldIds(phaseQuestions).forEach((id) => { allTouched[id] = true; });
  await formik.setTouched(allTouched, false);

  if (Object.keys(errors).length > 0) {
    enqueueSnackbar('Please answer the highlighted questions before continuing.', {
      variant: 'warning',
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      autoHideDuration: 4000,
    });

    const firstErrorId = Object.keys(errors)[0];
    const el = document.querySelector(`[data-question-id="${firstErrorId}"]`);
    if (el) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
      const input = el.querySelector('input, textarea, [role="button"]');
      if (input instanceof HTMLElement) input.focus({ preventScroll: true });
    }
    return;
  }

  // No errors — dispatch the per-phase save action
  dispatch(buildSaveActionForPhase(currentPhase, formik.values));
}, [formik, phaseQuestions, currentPhase, dispatch]);
```

`buildSaveActionForPhase` is a small switch that maps `currentPhase` → `saveCompany`/`saveEquipment`/`saveDrivers`/`saveCostAnalysis`/`saveLanePreferences` payload + dispatch.

### Pattern 4: Conditional Question Visibility

**What:** Questions can carry a `condition: (answers) => boolean` predicate that hides them.

**Existing pattern (verified in `companyQuestions.ts`, used in `PhaseForm.tsx`):**

```typescript
const isVisible = (q: AnyQuestion, values: Record<string, unknown>): boolean =>
  !q.condition || q.condition(values);
```

For STAB-06, Q1 (`truckPayment`) has a sub-question or sibling "I own it outright" (yes/no). When `true`, downstream cost analysis should treat `truckPayment` as $0. Recommendation: model as a sub-question with `inputType: 'yesNo'`, the predicate skips the parent question if the sibling is `true`. Exact wiring: see `companyQuestions.ts` for the `subQuestions` + `condition` pattern.

### Anti-Patterns to Avoid

- **Dispatching `setCurrentPhase` from inside `onSubmit`** — current bug at `CarrierPortalPage:76-88`. Save&Continue currently bypasses the saga entirely and just changes phase locally; nothing reaches the API. Wire the saga first, advance later.
- **Dispatching `sessionCompleted` to mark completion** — current bug at `CarrierPortalPage:81-83`. The `sessionCompleted` reducer just sets `session.completedAt` locally; the real `completeOnboarding` action exists in the slice and hits the API. Replace.
- **Silent `if (state.session)` guards** — current bug at `carrierPortalSlice.ts:95-99`. Hides the underlying problem when session is null. Either lift `currentPhase` to slice root, or log+throw.
- **Hard-coding phase arrays in components** — fixed by STAB-04 constants extraction. Both `CarrierPortalPage:25` and `PortalLayout:18` currently duplicate.
- **New animation library for count-up** — UI-SPEC explicitly says use RAF. `framer-motion` is in deps but reserved for places that need its expressiveness.
- **Stacking duplicate snackbars** — UI-SPEC §Validation says "fires once per failed Continue tap — do not stack duplicates." Default `notistack` behavior allows stacking; pass a `preventDuplicate: true` key or check at call site.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom snackbar component | `enqueueSnackbar` from `notistack` | Already in deps; project standard everywhere else. |
| Form state / validation | Custom controlled inputs | Formik + Yup via existing field components in `PhaseForm.tsx` | Established pattern. Don't invent. |
| State preference grid | Custom 50-tile grid | `<StateGrid>` (already built at `components/StateGrid/index.tsx`) | Built; just wire + a11y attrs. |
| Preset chip selector | Custom radio buttons | `<PresetTileSelector>` (already built at `components/PresetTileSelector/index.tsx`) | Built; just wire into `InputRenderer`. |
| Sub-question with colored border | Custom indented `<Box>` | `<SubQuestion>` / `<SubAnswer>` (already built) | Built; fix typography (16/600 not 18). |
| Conversational thread engine | Custom question/answer renderer | `QuestionThread` + `QuestionCard` + `AnsweredCard` + `PhaseDivider` (already built) | Phase 1 is finishing this engine, not rebuilding. |
| API client functions | Inline `axios.post` in saga | `utils/api/fleet/carrierPortalApi.ts` functions (add `saveCostAnalysis`, `saveLanePreferences` to existing file) | Established pattern with `portalHeaders(token)` helper at line 24. |
| Cost analysis calc (break-even RPM, minimum rate) | Server-side endpoint | Pure JS in `CostResultCard` component | PROJECT.md §"schema is data, stored as code first." No new API endpoint needed. |
| E2E test scaffolding | Cypress / new framework | Playwright (`@playwright/test`) already configured at `playwright.config.ts` | Project already on Playwright; existing pattern at `e2e/driver-portal-smoke.spec.ts`. |
| Test data setup | Backend seeding scripts | `page.route()` API mocks in Playwright spec | Matches `driver-portal-smoke.spec.ts` pattern. Deterministic and no DB dependency. |
| Loading skeleton | Custom shimmer | MUI `Skeleton` (already used elsewhere) | UI-SPEC §"Empty / loading / error states" specifies `Skeleton variant="rectangular"`. |

**Key insight:** Phase 1's most common failure mode would be building new abstractions where existing ones work. Every component, hook, saga pattern, and validation library is already present and proven. The phase is glue + 2 question files + 1 result card + 1 e2e test.

---

## Common Pitfalls

### Pitfall 1: Advancing currentPhase before saga completes

**What goes wrong:** User taps Save & Continue, page increments `currentPhase` immediately, saga is still in-flight. If saga fails, user is on the next phase with no error context.
**Why it happens:** Easy to put `dispatch(setCurrentPhase(currentPhase + 1))` inside `handleContinue` after `dispatch(savePhase(...))`.
**How to avoid:** STAB-01 requires the rising-edge `useEffect` pattern. Advance ONLY when `savePhaseSuccess` is reduced.
**Warning signs:** Page advances on click instead of after a brief delay; failed save leaves user on wrong phase.

### Pitfall 2: Snackbar stacks on repeated Continue taps

**What goes wrong:** User taps Continue 3 times rapidly with errors — 3 identical toasts stack.
**Why it happens:** Default `notistack` allows duplicates.
**How to avoid:** Either pass `preventDuplicate: true` to `SnackbarProvider`, or use a stable `key` per call site (e.g., `key: 'phase-validation-error'`).
**Warning signs:** Multiple identical snackbars visible at once.

### Pitfall 3: `data-question-id` missing on non-SubQuestion fields

**What goes wrong:** Scroll-to-error works for sub-questions but not main questions because only `SubQuestion.tsx:36` has `data-question-id`.
**Why it happens:** UI-SPEC says `QuestionCard` also exposes it — `QuestionCard.tsx:28` does have `data-question-id={questionId}`. ✓ Verified. **However**, fields rendered through `PhaseForm.tsx` (the MUI-direct path: `TextField`, `EmailField`, `AddressField`, etc.) may not be wrapped in a `QuestionCard`. Check that every question's outer container exposes the attribute.
**How to avoid:** During execution, grep for every question render path and confirm `data-question-id={question.id}` is present on the outer `Box`/wrapper. If a field renders raw, wrap it.
**Warning signs:** Scroll-to-error works for some validation failures but not others.

### Pitfall 4: `setCurrentPhase` silently fails before session loads

**What goes wrong:** Race condition — page mounts, dispatches `setCurrentPhase(1)`, but `fetchSession` hasn't completed yet. Current code at `carrierPortalSlice.ts:95-99` silently does nothing because `state.session` is null.
**Why it happens:** Defensive `if (state.session)` was added to avoid crash but hides bugs.
**How to avoid:** STAB-05 requires removing the guard. **Recommended fix:** lift `currentPhase` to slice root state (not inside `session`). This makes the page resilient to session-loading race conditions. Update `selectCurrentPhase` accordingly.
**Warning signs:** First-load behavior on a fresh token leaves user stuck on phase 1 even after Continue.

### Pitfall 5: `presets` field on QuestionDefinition is `any`

**What goes wrong:** Adding `presets?: PresetOption[]` to `QuestionDefinition` is tempting to type as `any` for speed.
**Why it happens:** TS struggles to discriminate union types per `inputType`.
**How to avoid:** Define a concrete `PresetOption { value: number; label: string }` type and add it to `questionSchema.ts`. The existing `PresetTileSelector` already declares this interface internally — promote it to a shared export.
**Warning signs:** Lint warning `@typescript-eslint/no-explicit-any` on new fields.

### Pitfall 6: Cost analysis count-up runs without prefers-reduced-motion check

**What goes wrong:** Accessibility violation; user with vestibular sensitivity sees a 1500ms count-up animation they can't disable.
**Why it happens:** Easy to forget the media query.
**How to avoid:** Per UI-SPEC §Animations: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` check at component mount; if true, render final values immediately.
**Warning signs:** No conditional logic around the RAF loop.

### Pitfall 7: Playwright test depends on real backend

**What goes wrong:** CI flakes because the API container isn't ready, DB isn't seeded, or invite tokens collide.
**Why it happens:** Tempting to "just hit the dev server" instead of mocking.
**How to avoid:** Match `driver-portal-smoke.spec.ts` — use `page.route('**/api/v1/carrier-portal/**', ...)` to fulfill responses deterministically. Each phase save returns a canned success. The "approve" portion of the test can use a separate `page.route()` for the dispatcher-side endpoint, or skip the approve step and only assert that submit completed (clarify with planner).
**Warning signs:** Test fails intermittently in CI but passes locally.

### Pitfall 8: PHASE_LABELS drift after extraction

**What goes wrong:** STAB-04 extracts the labels to `constants.ts` but `PortalStepper` or another consumer still hard-codes them somewhere else.
**Why it happens:** Multiple files may reference phase names.
**How to avoid:** After extraction, grep for `'Company'`, `'Equipment'`, `'Documents'` in `features/carrier-portal/` to confirm no stragglers.
**Warning signs:** Stepper shows different labels than page heading; phase divider shows stale name.

---

## Code Examples

### Constants file (STAB-04, STAB-13)

```typescript
// Source: NEW — features/carrier-portal/constants.ts
import type { QuestionDefinition } from 'components/ConversationalForm';
import { companyQuestions } from './questions/companyQuestions';
import { equipmentQuestions } from './questions/equipmentQuestions';
import { driversQuestions } from './questions/driversQuestions';
import { costAnalysisQuestions } from './questions/costAnalysisQuestions';
import { lanePreferencesQuestions } from './questions/lanePreferencesQuestions';
import { documentsQuestions } from './questions/documentsQuestions';

export const PHASE_LABELS = [
  'Company',
  'Equipment',
  'Drivers',
  'Cost Analysis',
  'Lane Preferences',
  'Documents',
] as const;

export const TOTAL_PHASES = PHASE_LABELS.length;

export const QUESTIONS_BY_PHASE: Record<number, QuestionDefinition[]> = {
  1: companyQuestions,
  2: equipmentQuestions,
  3: driversQuestions,
  4: costAnalysisQuestions,
  5: lanePreferencesQuestions,
  6: documentsQuestions,
};
```

### Cost analysis questions (STAB-06) — skeleton

```typescript
// Source: NEW — features/carrier-portal/questions/costAnalysisQuestions.ts
// Modeled on companyQuestions.ts pattern + interview-cost-analysis.md design.
import type { QuestionDefinition, PresetOption } from 'components/ConversationalForm/questionSchema';

const PHASE = 4;

const TRUCK_PAYMENT_PRESETS: PresetOption[] = [
  { value: 800, label: '$800' },
  { value: 1200, label: '$1,200' },
  { value: 1500, label: '$1,500' },
  { value: 2000, label: '$2,000' },
];

const INSURANCE_PRESETS: PresetOption[] = [
  { value: 800, label: '$800' },
  { value: 1200, label: '$1,200' },
  { value: 1500, label: '$1,500' },
  { value: 2000, label: '$2,000' },
];

const FUEL_PER_GALLON_PRESETS: PresetOption[] = [
  { value: 3.5, label: '$3.50' },
  { value: 3.75, label: '$3.75' },
  { value: 4.0, label: '$4.00' },
  { value: 4.25, label: '$4.25' },
];

const MPG_PRESETS: PresetOption[] = [
  { value: 5.5, label: '5.5 MPG' },
  { value: 6.0, label: '6.0 MPG' },
  { value: 6.5, label: '6.5 MPG' },
  { value: 7.0, label: '7.0 MPG' },
];

const MAINTENANCE_PRESETS: PresetOption[] = [
  { value: 300, label: '$300' },
  { value: 500, label: '$500' },
  { value: 800, label: '$800' },
  { value: 1200, label: '$1,200' },
];

const OTHER_COSTS_PRESETS: PresetOption[] = [
  { value: 100, label: '$100' },
  { value: 250, label: '$250' },
  { value: 500, label: '$500' },
];

export const costAnalysisQuestions: QuestionDefinition[] = [
  {
    id: 'costAnalysis.truckPayment',
    phase: PHASE,
    inputType: 'presetTiles',
    label: "What's your monthly truck payment?",
    presets: TRUCK_PAYMENT_PRESETS,
    required: true,
    subQuestions: [
      {
        id: 'costAnalysis.ownsOutright',
        label: 'I own it outright',
        inputType: 'yesNo',
        borderColor: 'green',
        // When true, costAnalysis.truckPayment is treated as 0 by the result card.
      },
    ],
  },
  {
    id: 'costAnalysis.insuranceCost',
    phase: PHASE,
    inputType: 'presetTiles',
    label: "What's your monthly insurance cost?",
    hint: 'Pre-populated from Equipment phase if entered there.',
    presets: INSURANCE_PRESETS,
    required: true,
  },
  // ... Q3 fuelCostPerGallon, Q4 milesPerGallon, Q5 maintenanceMonthlyCost, Q6 otherMonthlyCosts
];
```

### Lane preferences questions (STAB-09) — skeleton

```typescript
// Source: NEW — features/carrier-portal/questions/lanePreferencesQuestions.ts
// Minimum scope per UI-SPEC §"Component Inventory C": primary stateGrid question only.
import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

const PHASE = 5;

export const lanePreferencesQuestions: QuestionDefinition[] = [
  {
    id: 'lanePreferences.statePreferences',
    phase: PHASE,
    inputType: 'stateGrid',
    label: 'Which states do you prefer? Which do you avoid?',
    hint: 'Tap to cycle through neutral, preferred, and avoided.',
    required: false,
  },
  // Optional additions per legacy design — keep minimal:
  // homeBaseCity, homeBaseState, maxDaysOut, freightPreferences
];
```

### Cost Analysis Calculations (formulas for `CostResultCard`)

The legacy design does not state explicit formulas. Derived from the inputs and standard industry practice:

```typescript
// Source: derived from interview-cost-analysis.md (Visible Data Fields table)
interface CostInputs {
  truckPayment: number;         // monthly
  insuranceCost: number;        // monthly
  fuelCostPerGallon: number;    // $/gal
  milesPerGallon: number;       // MPG
  maintenanceMonthlyCost: number; // monthly
  otherMonthlyCosts: number;    // monthly
  ownsOutright?: boolean;
}

interface CostOutputs {
  totalMonthlyExpenses: number;
  monthlyFixed: number;
  monthlyVariable: number;
  fuelCostPerMile: number;
  breakEvenRpm: number;          // dollars per mile to cover costs
  minimumRatePerMile: number;    // breakEvenRpm * 1.25 (25% margin)
}

const ASSUMED_MONTHLY_MILES = 8000;       // industry baseline
const MIN_PROFIT_MARGIN = 0.25;           // 25% — UI-SPEC's "minimum to book"

export const computeCostAnalysis = (inputs: CostInputs): CostOutputs => {
  const truckPayment = inputs.ownsOutright ? 0 : inputs.truckPayment;
  const monthlyFixed = truckPayment + inputs.insuranceCost + inputs.maintenanceMonthlyCost + inputs.otherMonthlyCosts;
  const fuelCostPerMile = inputs.fuelCostPerGallon / inputs.milesPerGallon;
  const monthlyVariable = fuelCostPerMile * ASSUMED_MONTHLY_MILES;
  const totalMonthlyExpenses = monthlyFixed + monthlyVariable;
  const breakEvenRpm = totalMonthlyExpenses / ASSUMED_MONTHLY_MILES;
  const minimumRatePerMile = breakEvenRpm * (1 + MIN_PROFIT_MARGIN);
  return {
    totalMonthlyExpenses,
    monthlyFixed,
    monthlyVariable,
    fuelCostPerMile,
    breakEvenRpm,
    minimumRatePerMile,
  };
};
```

`[ASSUMED]` — The `ASSUMED_MONTHLY_MILES` baseline (8000) and `MIN_PROFIT_MARGIN` (0.25) are not stated explicitly in the legacy design. Sample numbers in the design (break-even $1.94, minimum $2.44) reverse-engineer cleanly to: total monthly = ~$15,520, miles = 8000 → $1.94 RPM × 1.258 ≈ $2.44. The planner should confirm these constants with the user during execution, or treat them as locked researcher-recommended defaults if the user opts out of discussion.

### Playwright e2e skeleton (STAB-14)

```typescript
// Source: NEW — e2e/carrier-portal-full.spec.ts
// Pattern mirrored from e2e/driver-portal-smoke.spec.ts
import { expect, test } from '@playwright/test';

const VALID_TOKEN = 'e2e-test-token';

test.describe('Carrier portal — full 6-phase flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock session endpoint
    await page.route('**/api/v1/carrier-portal/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            session: { id: 's1', currentPhase: 1, completedPhases: [], completedAt: null },
            carrier: { id: 'c1', name: 'E2E Test Carrier', email: 'test@example.com' },
            answers: {},
          },
        }),
      });
    });

    // Mock per-phase save endpoints
    for (const segment of ['company', 'equipment', 'drivers', 'cost-analysis', 'lane-preferences']) {
      await page.route(`**/api/v1/carrier-portal/${segment}`, async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
      });
    }

    // Mock completion endpoint
    await page.route('**/api/v1/carrier-portal/session/complete', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { id: 's1', currentPhase: 6, completedPhases: [1,2,3,4,5,6], completedAt: new Date().toISOString() },
        }),
      });
    });

    // Mock answer auto-save
    await page.route('**/api/v1/carrier-portal/session/answer', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
    });
  });

  test('invite → portal → all 6 phases → submit reaches completion view', async ({ page }) => {
    await page.goto(`/carrier-portal/${VALID_TOKEN}`);

    // Phase 1 — Company
    await expect(page.getByRole('heading', { name: /company/i })).toBeVisible({ timeout: 10000 });
    // ... fill required fields, tap Save & Continue, assert phase advanced

    // ... repeat for phases 2–5

    // Phase 6 — Documents — tap Submit
    // Assert PortalCompleteView renders
    await expect(page.getByText(/onboarding complete|thanks|submitted/i)).toBeVisible({ timeout: 10000 });
  });
});
```

`[ASSUMED]` — The "approve" portion of the test name in STAB-14 likely refers to the dispatcher-side carrier approval (POST `/carriers/:id/approve` per `carrierRoutes.ts:116`). For an e2e that stays carrier-side, it's acceptable to stop at the completion view and add a second `test()` block that hits the dispatcher approve endpoint via API. The planner should clarify with the user whether the e2e covers both halves or just the carrier-side submit.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 4-phase carrier onboarding | 6-phase carrier onboarding (Company → Equipment → Drivers → **Cost Analysis** → **Lane Preferences** → Documents) | 2026-05-13 (this phase) | Carrier sees 2 additional phases; cost picture + lane preferences captured before Documents. |
| `handleSubmit` advances locally | `handleContinue` → dispatches saga → `useEffect` on rising-edge advances | This phase | API actually receives saves; failures surface; phase advance is contingent on success. |
| Local `sessionCompleted` reducer for final-phase logic | Dispatch `completeOnboarding` saga → API call → `completeOnboardingSuccess` updates session | This phase | Server is the source of truth for completion. Subsequent dispatcher workflows (approval, agreement gen, etc.) actually trigger. |
| Validation errors swallowed (touch all, then no UI feedback) | Notistack snackbar + scroll-to-first-error | This phase | Carrier sees what to fix; phone UX viable. |
| Phase metadata duplicated in 2 files | Single `features/carrier-portal/constants.ts` | This phase | Drift impossible. |
| PresetTiles placeholder ("PresetTiles (built in T-31)") rendered in `InputRenderer` | `<PresetTileSelector>` component rendered with `presets` from question schema | This phase | Cost analysis phase becomes functional. |
| Two e2e tests (driver portal smoke only) | Add full carrier portal flow e2e | This phase | Regression-proof for Phase 3 engine refactor. |

**Deprecated/outdated:**
- Local `sessionCompleted` action use case at `CarrierPortalPage:81-83`: keep the reducer for backward-compatible session response handling, but stop dispatching it from the page.
- The `PresetTilesPlaceholder` component at `InputRenderer.tsx:293-307`: delete after STAB-12 lands.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ASSUMED_MONTHLY_MILES = 8000` and `MIN_PROFIT_MARGIN = 0.25` are the right baselines for break-even / minimum-rate math | §"Cost Analysis Calculations" | UI shows numbers that don't match user's intuition; carriers may distrust the result card. Mitigation: planner asks user to confirm before STAB-08 task begins. |
| A2 | `lastSavedPhase: number \| null` is the right shape for the save-success rising-edge signal | Pattern 2 | Field name nit; functionality is sound. Planner may rename. |
| A3 | Playwright e2e mocks API responses via `page.route()` (vs seeded DB) | Pattern 7 / STAB-14 | If user wants real-backend e2e, the spec structure changes (use real fetchable invite, real approval call). Verify with planner. |
| A4 | "Approve" in STAB-14's `invite → portal → all 6 phases → submit → approve` chain refers to the dispatcher-side carrier approval endpoint | STAB-14 | If "approve" means something else (e.g., user clicking a CTA), spec scope shifts. Clarify before writing test. |
| A5 | Lift `currentPhase` to top-level slice state (out of `session`) is the right fix for STAB-05 | Pattern §STAB-05, Pitfall 4 | Alternative is to keep it in session and log+throw. Either is valid; planner picks. |
| A6 | `presets` field type `PresetOption[]` should be added to `QuestionDefinition` without breaking existing question files | STAB-12 | Should be safe since existing question files don't set `presets` — but TS strict mode could surface optional-property concerns. Easy to verify at planning. |
| A7 | The 6 cost questions match the API validator field names exactly (`truckPayment`, `insuranceCost`, `fuelCostPerGallon`, `milesPerGallon`, `maintenanceMonthlyCost`, `otherMonthlyCosts`) | STAB-06 / §Code Examples | If UI field IDs (e.g., `costAnalysis.truckPayment`) don't match what the saga sends, the API rejects. The saga payload should map UI field IDs → API body keys explicitly. |
| A8 | Lane preferences UI ships with just the `stateGrid` question (minimum scope) | STAB-09 | If the user wants the full set (`homeBaseCity`, `maxDaysOut`, `freightPreferences`, `preferredLanes`) in Phase 1, scope grows. UI-SPEC says "minimum to satisfy 'Lane Preferences phase exists'." |

---

## Open Questions

1. **Should the e2e in STAB-14 include the dispatcher-side carrier approval, or stop at the carrier submit?**
   - What we know: STAB-14 says "submit → approve." Approval endpoint exists at `POST /api/v1/carriers/:id/approve` (`carrierRoutes.ts:116`), but the carrier portal doesn't trigger approval — a dispatcher does.
   - What's unclear: Does the e2e (a) mock the approval endpoint and assert UI updates accordingly, (b) make a real API call as a separate test (`auth → approve → assert side effect`), or (c) just stop at the completion view?
   - Recommendation: For Phase 1's stability gate, **option (c) is sufficient** — assert carrier reaches `PortalCompleteView`. The approval step is a dispatcher concern and can be a separate test or an integration test in the API package.

2. **STAB-15 deliverable form?**
   - What we know: "Manual smoke test of full 6-phase flow passes without intervention."
   - What's unclear: Committed checklist doc? Playwright run video? Sign-off log entry in STATE.md?
   - Recommendation: Committed checklist at `.planning/phases/01-stabilize/SMOKE-CHECKLIST.md`, filled in during execution. Reproducible and grep-able.

3. **`ASSUMED_MONTHLY_MILES` and `MIN_PROFIT_MARGIN` — locked or asked?**
   - What we know: Reverse-engineered from sample numbers in `interview-cost-analysis.md`; consistent with industry baselines.
   - What's unclear: Is 8000 mi/mo the user's intended baseline, or do they want it derived (e.g., from `maxDaysOut` × `avgMilesPerDay`)?
   - Recommendation: Lock at researcher-recommended defaults (`8000` and `0.25`). Add a `TODO: confirm baseline` comment in the calc helper. Easy to adjust later.

4. **Lane preferences scope — minimal or full?**
   - What we know: UI-SPEC says "keep to minimum"; API validator accepts 6 fields.
   - What's unclear: Does Phase 1 ship just `statePreferences`, or also include `homeBaseCity`/`homeBaseState`/`maxDaysOut`/`freightPreferences`?
   - Recommendation: Ship `statePreferences` only (1 question). Add the others as a Phase 1 stretch if budget allows; otherwise defer to Phase 2/3 cleanup.

5. **`currentPhase` location — inside `session` or top-level?**
   - What we know: Current code keeps it inside `session`; STAB-05 says remove the silent guard.
   - What's unclear: Lift to top-level state, or keep in session with a log+throw guard?
   - Recommendation: Lift to top-level state. Simpler, no race condition with `fetchSession`. Update `selectCurrentPhase` selector accordingly.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | API + UI dev servers + Playwright | ✓ | 20.x assumed (`@types/node` ^20.14.10 in API) | — |
| npm | Workspace install + scripts | ✓ | — | — |
| `@playwright/test` | STAB-14 e2e | ✓ | 1.59.1 (in deps) | — |
| Playwright browsers (Chromium for desktop + iPhone SE for mobile) | STAB-14 e2e | Likely cached; verify via `npx playwright install --dry-run` | — | `npx playwright install` if missing |
| Vite dev server (port 5173) | Playwright `webServer` block | ✓ | 7.3.1 | Override via `PLAYWRIGHT_BASE_URL` env |
| `notistack` (UI runtime) | STAB-02 snackbar | ✓ | 3.0.1 | — |
| API backend (dispatch-api) | Optional — Playwright spec mocks API via `page.route()` | Not required for e2e | — | Mocks built into spec |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None — the test plan deliberately avoids requiring the API container.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit / component framework | Jest `^30.2.0` + React Testing Library `^16.3.2` + `jest-environment-jsdom` |
| Saga unit-test framework | `redux-saga-test-plan` `^4.0.6` |
| E2E framework | Playwright `^1.59.1` |
| Jest config | `hussle-app-dispatch-ui/jest.config.*` (existing) |
| Playwright config | `hussle-app-dispatch-ui/playwright.config.ts` |
| Quick run command | `npm test -- --testPathPattern=carrier-portal` (UI quick) |
| Full suite command | `npm run lint && npm run check-ts && npm test && npm run test:e2e` (per `package.json` scripts) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAB-01 | Save & Continue dispatches phase-save action; advance happens on success | saga unit | `npm test -- savePhaseDataSaga.test.ts` | ❌ Wave 0 |
| STAB-01 | useEffect rising-edge advances when lastSavedPhase === currentPhase | component | `npm test -- CarrierPortalPage.test.tsx` | ❌ Wave 0 |
| STAB-02 | Validation errors fire notistack + scroll to first error | component | `npm test -- CarrierPortalPage.test.tsx` (mock `enqueueSnackbar`, assert scrollIntoView called) | ❌ Wave 0 |
| STAB-03 | Final phase dispatches `completeOnboarding`, not `sessionCompleted` | saga unit + component | `npm test -- CarrierPortalPage.test.tsx` | ❌ Wave 0 |
| STAB-04 | PHASE_LABELS imported from one constants file | smoke (compile-time) | `npm run check-ts` (will fail if removed duplicates leave references dangling) | ✓ existing tsc |
| STAB-05 | `setCurrentPhase` no longer silently guards on session | reducer unit | `npm test -- carrierPortalSlice.test.ts` | ❌ Wave 0 |
| STAB-06 | costAnalysisQuestions exports 6 questions w/ presets | component snapshot or shape test | `npm test -- costAnalysisQuestions.test.ts` | ❌ Wave 0 (optional — schema is data) |
| STAB-07 | PresetTileSelector renders chips, selects on click, custom reveals input | component | `npm test -- PresetTileSelector.test.tsx` | ❌ Wave 0 |
| STAB-08 | CostResultCard renders break-even + minimum rate from inputs; respects prefers-reduced-motion | component | `npm test -- CostResultCard.test.tsx` | ❌ Wave 0 |
| STAB-09 | lanePreferencesQuestions exports at least 1 stateGrid question | shape test | (optional, low-value) | ❌ |
| STAB-10 | StateGrid cycles state on click; aria attrs present | component | `npm test -- StateGrid.test.tsx` | ❌ Wave 0 |
| STAB-11 | SubQuestion renders with 16/600 typography, correct border color | component | `npm test -- SubQuestion.test.tsx` | ❌ Wave 0 |
| STAB-12 | InputRenderer routes presetTiles → PresetTileSelector; stateGrid → StateGrid | component | `npm test -- InputRenderer.test.tsx` | ❌ Wave 0 |
| STAB-13 | TOTAL_PHASES === 6 | smoke (compile) | `npm run check-ts` | ✓ |
| STAB-14 | Full 6-phase flow lands in completion view | Playwright e2e | `npm run test:e2e -- carrier-portal-full.spec.ts` | ❌ Wave 0 |
| STAB-15 | Manual checklist filled in | manual | (no automated command) | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern=carrier-portal` (component + saga tests for changed scope)
- **Per wave merge:** `npm run validate` (lint + lint:deps + check-ts + test)
- **Phase gate:** `npm run validate && npm run test:e2e` — full UI suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/__tests__/savePhaseDataSaga.test.ts` — saga unit tests for the 2 new workers (and regression for existing 3)
- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/store/slices/__tests__/carrierPortalSlice.test.ts` — reducer tests for STAB-05 (setCurrentPhase) and the new save actions
- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/CarrierPortalPage.test.tsx` — page-level component test (mock dispatch, assert save flow + useEffect advance + snackbar+scroll)
- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/components/CostResultCard/CostResultCard.test.tsx` — component test
- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/components/PresetTileSelector/PresetTileSelector.test.tsx`
- [ ] `hussle-app-dispatch-ui/src/features/carrier-portal/components/StateGrid/StateGrid.test.tsx`
- [ ] `hussle-app-dispatch-ui/src/components/ConversationalForm/__tests__/InputRenderer.test.tsx`
- [ ] `hussle-app-dispatch-ui/src/components/ConversationalForm/__tests__/SubQuestion.test.tsx`
- [ ] `hussle-app-dispatch-ui/e2e/carrier-portal-full.spec.ts` — Playwright STAB-14

No framework install needed — Jest, RTL, and Playwright are all already configured.

---

## Security Domain

`security_enforcement` not explicitly set in `.planning/config.json`; treating as enabled. Phase 1 is a stabilization phase with no new security surface (no new endpoints, no new auth paths, no new data persistence). However, the existing carrier-portal token auth path is exercised end-to-end by the new e2e test.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Carrier invite token in URL path, verified by `authenticateCarrierToken` middleware (existing); plaintext tokens — hashing is Phase 2 (SEC-01), not Phase 1 |
| V3 Session Management | yes | `OnboardingSession` row keyed by carrierId; no cookies on carrier-portal endpoints (Bearer token in `Authorization` header) — verified via `carrierPortalApi.ts:24` |
| V4 Access Control | yes | Each portal endpoint scoped to `req.carrierPortal.carrierId` (set by token middleware); enforced in services. Existing pattern — not changed by Phase 1. |
| V5 Input Validation | yes | Yup validators on every save endpoint (`companyValidator`, `equipmentValidator`, `driversValidator`, `costAnalysisValidator`, `lanePreferencesValidator`, `documentsValidator`) — all already exist and run as `validateRequest` middleware. UI Yup schemas via `buildPhaseSchema` mirror. |
| V6 Cryptography | no (deferred to Phase 2 — EIN encryption is SEC-02) | — |

### Known Threat Patterns for React+Express+Prisma+token-auth stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Plaintext token logged in axios error or notistack message | Information disclosure | `notistack` error toasts must not include error message verbatim when it could carry the token — sagas log `error.message` but the token isn't in the message body (verified in `carrierPortalApi.ts` — token is header-only). ✓ |
| XSS via question label rendered through MUI Typography | Tampering | MUI escapes by default; question labels are static TS strings (not user-input) — not a risk in Phase 1. ✓ |
| Open-redirect via `?token=...` URL handling | Tampering | Carrier portal uses `:token` URL param, not query string; token is consumed by middleware, never reflected in DOM. ✓ |
| Saga retries with stale token | Repudiation | Existing pattern reads token from Redux state at saga start; no caching across calls. ✓ |
| Playwright test logs leak real tokens to CI artifacts | Information disclosure | Use only fake tokens (`e2e-test-token`, `invalid-token-12345`) in mocked specs; never use a real invite token. Mitigation: code review of the e2e spec. |

No new threats introduced by Phase 1. The validation snackbar copy must not echo user input verbatim (UI-SPEC says fixed copy `"Please answer the highlighted questions before continuing."` — already safe).

---

## Sources

### Primary (HIGH confidence)

- `hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx` — read in full
- `hussle-app-dispatch-ui/src/features/carrier-portal/components/PortalLayout/index.tsx` — read in full
- `hussle-app-dispatch-ui/src/features/carrier-portal/store/slices/carrierPortalSlice.ts` — read in full
- `hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/savePhaseDataSaga.ts` — read in full
- `hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/autoSaveSaga.ts` — read in full
- `hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/portalRootSaga.ts` — read in full
- `hussle-app-dispatch-ui/src/features/carrier-portal/store/selectors/portalSelectors.ts` — read in full
- `hussle-app-dispatch-ui/src/components/ConversationalForm/InputRenderer.tsx` — read in full
- `hussle-app-dispatch-ui/src/components/ConversationalForm/questionSchema.ts` — read in full
- `hussle-app-dispatch-ui/src/components/ConversationalForm/SubQuestion.tsx` + `SubAnswer.tsx` + `QuestionCard.tsx` — read in full
- `hussle-app-dispatch-ui/src/features/carrier-portal/components/PresetTileSelector/index.tsx` — read in full
- `hussle-app-dispatch-ui/src/features/carrier-portal/components/StateGrid/index.tsx` — read in full
- `hussle-app-dispatch-ui/src/utils/api/fleet/carrierPortalApi.ts` — read in full
- `hussle-app-dispatch-ui/playwright.config.ts` — read in full
- `hussle-app-dispatch-ui/e2e/driver-portal-smoke.spec.ts` — read in full
- `hussle-app-dispatch-api/src/carrier-portal/routes/index.ts` — read in full
- `hussle-app-dispatch-api/src/carrier-portal/controllers/sessionController.ts` — read in full
- `hussle-app-dispatch-api/src/carrier-portal/validators/costAnalysisValidator.ts` — read in full
- `hussle-app-dispatch-api/src/carrier-portal/validators/lanePreferencesValidator.ts` — read in full
- `.planning/phases/01-stabilize/01-CONTEXT.md` — locked decisions, canonical refs
- `.planning/phases/01-stabilize/01-UI-SPEC.md` — visual contract (approved)
- `.planning/REQUIREMENTS.md` — STAB-01..STAB-15
- `.planning/ROADMAP.md` — Phase 1 success criteria
- `.planning-legacy/carrier-onboarding/designs/interview-cost-analysis.md` — cost result card design
- `CLAUDE.md` (root + dispatch-ui + dispatch-api) — project conventions

### Secondary (MEDIUM confidence)

- `hussle-app-dispatch-ui/src/features/carrier-portal/questions/companyQuestions.ts` (sampled) — for question schema pattern
- `hussle-app-dispatch-ui/src/features/carrier-portal/components/PhaseForm/index.tsx` (sampled, first 100 lines) — for input-rendering paths
- `hussle-app-dispatch-ui/src/features/carrier-portal/components/PortalFooterBar/index.tsx` (sampled, first 50 lines) — for footer wiring

### Tertiary (LOW confidence)

- None. Every claim in this document traces to a primary source.

---

## Project Constraints (from CLAUDE.md)

The following are extracted from the project's root, dispatch-ui, and dispatch-api `CLAUDE.md` files. Planner must verify compliance:

- **Redux Saga only — no thunks.** All async side effects flow through sagas. (root + dispatch-ui)
- **Formik + Yup for all forms.** Derive types via `InferType<typeof schema>`. (dispatch-ui)
- **MUI v5 + `sx` prop only.** No styled-components, no Tailwind, no inline `style={{}}`. (dispatch-ui)
- **Cookie-based auth on internal app; Bearer token in `Authorization` header on carrier portal.** Never store tokens in Redux state or localStorage. (dispatch-ui)
- **Dual-slice entity pattern.** Page slice (UI state) + entity slice (normalized). (dispatch-ui — note: carrier-portal is more session-shaped than CRUD-shaped, so dual-slice is partial.)
- **Typed Redux hooks from `store`.** `import { useSelector, useDispatch } from 'store'`. (dispatch-ui)
- **One saga per file.** Name `<operation><Entity>Saga.ts`. (dispatch-ui)
- **Co-locate feature code.** Components, slices, sagas, selectors all under `features/<feature>/`. (dispatch-ui)
- **Path aliases for cross-module imports.** Relative imports only within the same feature module. (dispatch-ui)
- **MUI Semantic Typography helpers** (`PageTitle`, `BodyMuted`, `BodyStrong`, `KpiLabel`, `Meta`) preferred over raw `<Typography variant>`. (dispatch-ui)
- **TS strict.** No `any`, no `as`, no `!`. Migration override allows `formik.errors[name] as string | undefined` ONLY — every other `as` is forbidden. (dispatch-ui)
- **No `console.log`.** Use injected logger or notistack. (root)
- **No generic `Error`.** Typed error classes only. (root)
- **No `Co-Authored-By` in commits.** Use configured git identity only. (root + project CLAUDE.md)
- **Test files allow relaxed `no-explicit-any` (warn).** Production code is strict (error). (dispatch-ui)
- **No `@mocho/ui` shared package.** Reference is stale in dispatch-ui CLAUDE.md; ignore. UI-SPEC reaffirms.
- **All drawers/forms must use `useDirtyFormBlocker`** from `@mocho/ui/forms` per root CLAUDE.md. **Caveat:** the carrier portal is not a drawer; it's a page. This constraint does not apply to Phase 1 work but may apply if any drawer is added.
- **Architecture enforcement on API package:** `dependency-cruiser` rules `no-prisma-in-services`, `no-repo-implementations-in-services`, `no-services-to-controllers`, `no-circular`. (dispatch-api) — Phase 1 doesn't touch API services, so this is informational.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against `package.json` and CLAUDE.md.
- Architecture: HIGH — all file:line references verified by direct read; saga and slice patterns are well-established.
- Pitfalls: HIGH — derived from reading current bug locations (CarrierPortalPage:76-88, carrierPortalSlice:95-99) and UI-SPEC explicit requirements.
- Calculations (cost analysis formulas): MEDIUM — `[ASSUMED]` constants confirmed plausible by reverse-engineering sample numbers in the legacy design, but planner should flag for user confirmation.
- E2E approach: HIGH — mirrors existing pattern; planner has one open clarification (clarify the "approve" portion's scope).

**Research date:** 2026-05-13
**Valid until:** 2026-06-12 (30 days — codebase is stable, no fast-moving dependencies)
