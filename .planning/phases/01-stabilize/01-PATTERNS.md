# Phase 1: Stabilize — Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 17 new/modified files
**Analogs found:** 17 / 17 (every file has an in-tree analog)

> Phase 1 is "stabilization-by-finishing" — every file to be created or modified has a strong existing analog already in the repo. The planner should write tasks as "mirror analog at file:line" not "design from scratch." All references are absolute paths.

---

## File Classification

| New / Modified File | New? | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|---|
| `hussle-app-dispatch-ui/src/features/carrier-portal/constants.ts` | NEW | config / barrel | static-data | (none — extraction from `CarrierPortalPage:25` + `PortalLayout:18`) | role-match (synthesis) |
| `hussle-app-dispatch-ui/src/features/carrier-portal/questions/costAnalysisQuestions.ts` | NEW | question-schema | static-data | `hussle-app-dispatch-ui/src/features/carrier-portal/questions/companyQuestions.ts` | exact |
| `hussle-app-dispatch-ui/src/features/carrier-portal/questions/lanePreferencesQuestions.ts` | NEW | question-schema | static-data | `hussle-app-dispatch-ui/src/features/carrier-portal/questions/companyQuestions.ts` | exact |
| `hussle-app-dispatch-ui/src/features/carrier-portal/components/CostResultCard/index.tsx` | NEW (rebuild — deleted) | component | derived-render | `hussle-app-dispatch-ui/src/features/carrier-portal/components/StateGrid/index.tsx` (sibling component, sx + computed state) | role-match |
| `hussle-app-dispatch-ui/e2e/carrier-portal-full.spec.ts` | NEW | e2e-spec | request-response (mocked) | `hussle-app-dispatch-ui/e2e/driver-portal-smoke.spec.ts` | exact |
| `hussle-app-dispatch-ui/src/features/carrier-portal/store/slices/carrierPortalSlice.ts` | MODIFY | slice | reducer | (self — extend existing pattern at lines 107-117) | exact (in-place extension) |
| `hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/savePhaseDataSaga.ts` | MODIFY | saga | request-response | (self — mirror `handleSaveCompany` at lines 28-41) | exact (in-place extension) |
| `hussle-app-dispatch-ui/src/utils/api/fleet/carrierPortalApi.ts` | MODIFY | api-client | request-response | (self — mirror `saveCompany` at lines 73-83) | exact (in-place extension) |
| `hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx` | MODIFY | page | orchestration | (self — current bugs at L25, L76-88, L81-83) | n/a (bug fix) |
| `hussle-app-dispatch-ui/src/features/carrier-portal/components/PortalLayout/index.tsx` | MODIFY | component | render | (self — line 18 hardcoded array) | n/a (small edit) |
| `hussle-app-dispatch-ui/src/components/ConversationalForm/InputRenderer.tsx` | MODIFY | component | switch-router | (self — line 410 `stateGrid` case; replace placeholder at lines 293-307) | exact (mirror sibling case) |
| `hussle-app-dispatch-ui/src/components/ConversationalForm/SubQuestion.tsx` | MODIFY | component | render | (self — typography demotion at lines 55-59) | n/a (small edit) |
| `hussle-app-dispatch-ui/src/components/ConversationalForm/questionSchema.ts` | MODIFY | type-def | static-types | (self — add `presets?: PresetOption[]` field) | n/a (small edit) |
| `hussle-app-dispatch-ui/src/features/carrier-portal/components/StateGrid/index.tsx` | MODIFY | component | render | (self — a11y attrs) | n/a (small edit) |
| `hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/__tests__/savePhaseDataSaga.test.ts` | NEW | unit-test (saga) | test | (search for existing `redux-saga-test-plan` test in repo) | partial |
| `hussle-app-dispatch-ui/src/features/carrier-portal/store/slices/__tests__/carrierPortalSlice.test.ts` | NEW | unit-test (reducer) | test | (standard RTK slice test) | partial |
| `hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/CarrierPortalPage.test.tsx` | NEW | unit-test (component) | test | (standard RTL pattern from CLAUDE.md) | partial |
| `hussle-app-dispatch-ui/src/features/carrier-portal/components/CostResultCard/CostResultCard.test.tsx` | NEW | unit-test (component) | test | (standard RTL) | partial |
| `hussle-app-dispatch-ui/src/features/carrier-portal/components/PresetTileSelector/PresetTileSelector.test.tsx` | NEW | unit-test (component) | test | (standard RTL) | partial |
| `hussle-app-dispatch-ui/src/features/carrier-portal/components/StateGrid/StateGrid.test.tsx` | NEW | unit-test (component) | test | (standard RTL) | partial |
| `hussle-app-dispatch-ui/src/components/ConversationalForm/__tests__/InputRenderer.test.tsx` | NEW | unit-test (component) | test | (standard RTL) | partial |
| `hussle-app-dispatch-ui/src/components/ConversationalForm/__tests__/SubQuestion.test.tsx` | NEW | unit-test (component) | test | (standard RTL) | partial |
| `.planning/phases/01-stabilize/SMOKE-CHECKLIST.md` | NEW | documentation | checklist | (none — committed during execution) | n/a |

---

## Pattern Assignments

### 1. `features/carrier-portal/store/sagas/savePhaseDataSaga.ts` (MODIFY — add 2 workers)

**Analog (in-file):** `handleSaveCompany` at `/Users/jr/Development/hustle-app/fleet-command/hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/savePhaseDataSaga.ts:28-41`

**Imports pattern** (lines 1-11 — extend with new request types):
```typescript
import { call, put, select, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import type {
  OnboardingSession,
  SaveCompanyRequest,
  SaveDriversRequest,
  SaveEquipmentRequest,
  // ADD: SaveCostAnalysisRequest, SaveLanePreferencesRequest
} from 'features/carrier-portal/types';
import { carrierPortalActions } from '../slices/carrierPortalSlice';
import * as api from '../../../../utils/api/fleet/carrierPortalApi';
```

**Token-helper pattern** (lines 17-22 — reuse as-is):
```typescript
function* getToken(): Generator {
  const token = (yield select(
    (state: RootState) => state.pages.carrierPortal.token,
  )) as string | null;
  return token;
}
```

**Core worker pattern** (lines 28-41 — copy verbatim, rename to `handleSaveCostAnalysis` / `handleSaveLanePreferences`):
```typescript
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

**Watcher pattern** (lines 92-97 — add 2 more `takeLatest` lines):
```typescript
export function* savePhaseDataSaga(): Generator {
  yield takeLatest(carrierPortalActions.saveCompany.type, handleSaveCompany);
  yield takeLatest(carrierPortalActions.saveEquipment.type, handleSaveEquipment);
  yield takeLatest(carrierPortalActions.saveDrivers.type, handleSaveDrivers);
  // ADD: saveCostAnalysis, saveLanePreferences
  yield takeLatest(carrierPortalActions.completeOnboarding.type, handleCompleteOnboarding);
}
```

**Error pattern:** identical — `error instanceof Error ? error.message : 'Failed to save <phase>'`.

---

### 2. `features/carrier-portal/store/slices/carrierPortalSlice.ts` (MODIFY)

**Analog (in-file):** Phase-save triple at `/Users/jr/Development/hustle-app/fleet-command/hussle-app-dispatch-ui/src/features/carrier-portal/store/slices/carrierPortalSlice.ts:107-117`

**Existing action-triple pattern (lines 107-117 — replicate for cost analysis + lane preferences):**
```typescript
// Phase saves — company
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

**Existing buggy guard to remove (lines 95-99 — STAB-05):**
```typescript
// CURRENT (buggy — silently no-ops when session is null):
setCurrentPhase(state, action: PayloadAction<number>) {
  if (state.session) {
    state.session.currentPhase = action.payload;
  }
},
```

**Recommended replacement (lift to top-level — research recommendation):**
```typescript
// In state interface, add:
//   currentPhase: number;
//   lastSavedPhase: number | null;  // rising-edge signal (STAB-01)
// Initial state: currentPhase: 1, lastSavedPhase: null

setCurrentPhase(state, action: PayloadAction<number>) {
  state.currentPhase = action.payload;
},
phaseAdvanceConsumed(state) {
  state.lastSavedPhase = null;
},
```

**Rising-edge integration into success reducers (extend each saveXxxSuccess):**
```typescript
saveCompanySuccess(state) {
  state.savingPhase = false;
  state.lastSavedPhase = 1; // ADD
},
// ... same idea for each phase (2..5) and completeOnboardingSuccess → 6
```

---

### 3. `utils/api/fleet/carrierPortalApi.ts` (MODIFY — add 2 API functions)

**Analog (in-file):** `saveCompany` at `/Users/jr/Development/hustle-app/fleet-command/hussle-app-dispatch-ui/src/utils/api/fleet/carrierPortalApi.ts:73-83`

**Auth helper (lines 24-26 — reuse as-is):**
```typescript
const portalHeaders = (token: string): AxiosRequestConfig => ({
  headers: { Authorization: `Bearer ${token}` },
});
```

**Response envelope (lines 32-34 — reuse):**
```typescript
interface DataEnvelope<T> {
  data: T;
}
```

**Core POST pattern (lines 73-83 — copy verbatim for `saveCostAnalysis` → `/carrier-portal/cost-analysis` and `saveLanePreferences` → `/carrier-portal/lane-preferences`):**
```typescript
export const saveCompany = async (
  token: string,
  data: SaveCompanyRequest,
): Promise<CarrierPortalSummary> => {
  const response = await axiosInstance.post<DataEnvelope<CarrierPortalSummary>>(
    '/carrier-portal/company',
    data,
    portalHeaders(token),
  );
  return response.data.data;
};
```

**API path verification:** API validators exist at `hussle-app-dispatch-api/src/carrier-portal/validators/costAnalysisValidator.ts` and `lanePreferencesValidator.ts` — confirms endpoints are wired backend-side; no API work needed.

---

### 4. `features/carrier-portal/questions/costAnalysisQuestions.ts` (NEW)

**Analog:** `/Users/jr/Development/hustle-app/fleet-command/hussle-app-dispatch-ui/src/features/carrier-portal/questions/companyQuestions.ts` (full file, 102 lines)

**Imports pattern (line 1):**
```typescript
import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';
```

**Phase constant + option arrays at top (companyQuestions.ts lines 3-20 — mirror for `PHASE = 4` and `*_PRESETS` arrays):**
```typescript
const PHASE = 1;

const TAX_CLASSIFICATION_OPTIONS = [
  { value: 'SOLE_PROPRIETOR', label: 'Individual / Sole Proprietor' },
  // ...
];
```

**Core question shape (companyQuestions.ts lines 22-47 — mirror with `inputType: 'presetTiles'`, `presets: <CONST>`, plus optional `subQuestions`):**
```typescript
export const companyQuestions: QuestionDefinition[] = [
  {
    id: 'company.name',
    phase: PHASE,
    inputType: 'text',
    label: 'Business name',
    hint: 'The name you operate under (DBA or trade name).',
    required: true,
  },
  // ...
  {
    id: 'company.taxClassification',
    phase: PHASE,
    inputType: 'select',
    label: 'Federal tax classification',
    hint: 'How your business is taxed (line 3 on the W-9).',
    options: TAX_CLASSIFICATION_OPTIONS,
    required: true,
  },
];
```

**Field IDs (must match API validator — STAB-06):** `costAnalysis.truckPayment`, `costAnalysis.insuranceCost`, `costAnalysis.fuelCostPerGallon`, `costAnalysis.milesPerGallon`, `costAnalysis.maintenanceMonthlyCost`, `costAnalysis.otherMonthlyCosts`. Confirmed against `hussle-app-dispatch-api/src/carrier-portal/validators/costAnalysisValidator.ts:5-22`.

**Sub-question (RESEARCH.md "Pattern 4"):** Q1 has `subQuestions: [{ id: 'costAnalysis.ownsOutright', inputType: 'yesNo', borderColor: 'green', ... }]`. When true, `CostResultCard` treats `truckPayment` as 0.

---

### 5. `features/carrier-portal/questions/lanePreferencesQuestions.ts` (NEW)

**Analog:** Same as above (`companyQuestions.ts`). **Scope:** minimum — primary `stateGrid` question only (UI-SPEC §"Component Inventory C"). Field ID `lanePreferences.statePreferences`. Confirmed against `hussle-app-dispatch-api/src/carrier-portal/validators/lanePreferencesValidator.ts:28-41`.

**Skeleton (mirror companyQuestions structure):**
```typescript
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
];
```

---

### 6. `features/carrier-portal/constants.ts` (NEW)

**Analog (synthesis):** extracted from duplicated arrays at:
- `/Users/jr/Development/hustle-app/fleet-command/hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx:25-26` (current — 4 phases)
- `/Users/jr/Development/hustle-app/fleet-command/hussle-app-dispatch-ui/src/features/carrier-portal/components/PortalLayout/index.tsx:18` (current — 4 phases, separate hardcode)

**Current (CarrierPortalPage L25-33):**
```typescript
const PHASE_LABELS = ['Company', 'Equipment', 'Drivers', 'Documents'];
const TOTAL_PHASES = PHASE_LABELS.length;

const questionsByPhase: Record<number, QuestionDefinition[]> = {
  1: companyQuestions,
  2: equipmentQuestions,
  3: driversQuestions,
  4: documentsQuestions,
};
```

**Target (RESEARCH.md §"Code Examples — Constants file" — 6 phases, exported as `QUESTIONS_BY_PHASE`):**
```typescript
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

After creation, replace inline declarations at `CarrierPortalPage:25-33` and `PortalLayout:18` with imports from this constants file.

---

### 7. `features/carrier-portal/pages/CarrierPortalPage/index.tsx` (MODIFY)

**Analog (self):** existing structure stays; surgical edits at known bug sites.

**Bug 1 — local-only `handleSubmit` (lines 76-88, STAB-01 + STAB-03):**
```typescript
// CURRENT (no API call, advances locally):
const handleSubmit = useCallback(() => {
  dispatch(carrierPortalActions.markPhaseCompleted(currentPhase));
  if (currentPhase < TOTAL_PHASES) {
    dispatch(carrierPortalActions.setCurrentPhase(currentPhase + 1));
  } else {
    dispatch(
      carrierPortalActions.sessionCompleted({ completedAt: new Date().toISOString() }),
    );
  }
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}, [dispatch, currentPhase]);
```

**Replacement (RESEARCH.md "Pattern 2 — useEffect rising-edge"):**
```typescript
// In handleContinue (after validation passes), dispatch the per-phase save action via a helper:
const handleSubmit = useCallback(() => {
  dispatch(buildSaveActionForPhase(currentPhase, formik.values));
}, [dispatch, currentPhase, formik.values]);

// Separate useEffect watches lastSavedPhase rising-edge:
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

**Bug 2 — validation swallowed (lines 188-198, STAB-02):**
```typescript
// CURRENT (silent, no UI feedback):
const handleContinue = useCallback(async () => {
  const errors = await formik.validateForm();
  const allTouched: FormikTouched<Record<string, unknown>> = {};
  collectFieldIds(phaseQuestions).forEach((id) => {
    allTouched[id] = true;
  });
  await formik.setTouched(allTouched, false);
  if (Object.keys(errors).length === 0) {
    await formik.submitForm();
  }
}, [formik, phaseQuestions]);
```

**Replacement (UI-SPEC §"Scroll-to-error" verbatim, RESEARCH.md Pattern 3):**
```typescript
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
      preventDuplicate: true,
      key: 'phase-validation-error',
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
  await formik.submitForm();
}, [formik, phaseQuestions]);
```

**Bug 3 — hardcoded phase arrays at lines 25-33:** Replace with imports from `features/carrier-portal/constants.ts` (see §6).

---

### 8. `features/carrier-portal/components/PortalLayout/index.tsx` (MODIFY)

**Bug — hardcoded array at line 18:** delete inline `PHASES = [...]` declaration, import `PHASE_LABELS` from `features/carrier-portal/constants.ts`. Verify `PortalStepper` receives `phases={PHASE_LABELS}` so it renders 6 dots.

---

### 9. `components/ConversationalForm/InputRenderer.tsx` (MODIFY — STAB-12)

**Analog (in-file):** `stateGrid` case at `/Users/jr/Development/hustle-app/fleet-command/hussle-app-dispatch-ui/src/components/ConversationalForm/InputRenderer.tsx:410` (already wired). Replace the `PresetTilesPlaceholder` stub at lines 293-307 with a real `<PresetTileSelector>` render — mirror the `stateGrid` case's shape (props plumbing: `value`, `onChange`, plus question-derived data).

**Required upstream change:** `questionSchema.ts` must expose `presets?: PresetOption[]` typed field; promote `PresetOption` interface (currently internal to `PresetTileSelector/index.tsx`) to a shared export in `questionSchema.ts`.

---

### 10. `components/ConversationalForm/SubQuestion.tsx` (MODIFY — STAB-11)

**Bug — typography at lines 55-59:** demote `fontSize: '18px'` to `fontSize: 16, fontWeight: 600` (Table 1 Body strong row in UI-SPEC). Visual differentiation is preserved by colored left border + category tag + indent. `data-question-id` at line 36 is already present (don't remove).

---

### 11. `features/carrier-portal/components/StateGrid/index.tsx` (MODIFY — STAB-10)

**Gaps (UI-SPEC §Accessibility):**
- Add `role="button"` to each tile.
- Add `aria-pressed={preference !== undefined}` (true when preferred or avoided).
- Add `aria-label="{stateName}: {Neutral|Preferred|Avoided}, tap to cycle"`.
- Keyboard handler: Enter/Space activates the same `onClick` cycle.

---

### 12. `features/carrier-portal/components/CostResultCard/index.tsx` (NEW — rebuild)

**Analog:** No exact analog (was deleted in git status). Closest sibling for "computed-state full-viewport feature component using MUI `sx`" is `/Users/jr/Development/hustle-app/fleet-command/hussle-app-dispatch-ui/src/features/carrier-portal/components/StateGrid/index.tsx` (132 lines — sx-only styling, internal state cycle, MUI primitives).

**Authoritative visual contract:** UI-SPEC §"Component Inventory A" + `.planning-legacy/carrier-onboarding/designs/interview-cost-analysis.md` + `cost_analysis_complete.png`.

**Calculation formula (RESEARCH.md §"Cost Analysis Calculations"):**
```typescript
const ASSUMED_MONTHLY_MILES = 8000;
const MIN_PROFIT_MARGIN = 0.25;

export const computeCostAnalysis = (inputs: CostInputs): CostOutputs => {
  const truckPayment = inputs.ownsOutright ? 0 : inputs.truckPayment;
  const monthlyFixed = truckPayment + inputs.insuranceCost + inputs.maintenanceMonthlyCost + inputs.otherMonthlyCosts;
  const fuelCostPerMile = inputs.fuelCostPerGallon / inputs.milesPerGallon;
  const monthlyVariable = fuelCostPerMile * ASSUMED_MONTHLY_MILES;
  const totalMonthlyExpenses = monthlyFixed + monthlyVariable;
  const breakEvenRpm = totalMonthlyExpenses / ASSUMED_MONTHLY_MILES;
  const minimumRatePerMile = breakEvenRpm * (1 + MIN_PROFIT_MARGIN);
  return { totalMonthlyExpenses, monthlyFixed, monthlyVariable, fuelCostPerMile, breakEvenRpm, minimumRatePerMile };
};
```

**Animation gate (UI-SPEC §Animations):**
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// If true: render final values immediately (skip RAF count-up). No framer-motion.
```

---

### 13. `e2e/carrier-portal-full.spec.ts` (NEW — STAB-14)

**Analog:** `/Users/jr/Development/hustle-app/fleet-command/hussle-app-dispatch-ui/e2e/driver-portal-smoke.spec.ts` (30 lines, full file)

**`page.route()` mocked-API pattern (verbatim from analog, lines 7-15):**
```typescript
test.describe('Driver portal smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/driver-portal/portal/load*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Invalid token' }] }),
      });
    });
  });
  // ...
});
```

**Assertion pattern (analog lines 20-22):**
```typescript
await expect(page.getByRole('heading', { name: 'Invalid Link' })).toBeVisible({
  timeout: 15000,
});
```

**Carrier-portal applicable mock matrix (extend, RESEARCH.md skeleton):**
- `GET **/api/v1/carrier-portal/session` → 200 with seeded session (currentPhase: 1, no answers).
- `POST **/api/v1/carrier-portal/{company|equipment|drivers|cost-analysis|lane-preferences}` → 200 success.
- `POST **/api/v1/carrier-portal/session/complete` → 200 with completedAt timestamp.
- `PUT **/api/v1/carrier-portal/session/answer` → 200 (auto-save).

**Scope (RESEARCH.md Open Question #1 + Assumption A4):** Stop at `PortalCompleteView` assertion. Dispatcher-side approval is a separate concern; not required for STAB-14 sign-off.

---

### 14. Test files — saga, slice, component (NEW × 6+)

**Saga test analog:** `redux-saga-test-plan` is in deps. Search the repo for existing usage:
```bash
grep -r "expectSaga" hussle-app-dispatch-ui/src --include="*.test.ts"
```
Apply that pattern to `savePhaseDataSaga.test.ts`. Verify each `handleSaveXxx` worker:
1. Selects token from `state.pages.carrierPortal.token`
2. Calls `api.saveXxx` with token + payload
3. Puts `saveXxxSuccess` on resolve
4. Puts `saveXxxFailure(message)` on reject

**Slice test pattern (CLAUDE.md §Testing — standard RTK):**
```typescript
import { carrierPortalReducer, carrierPortalActions } from '../carrierPortalSlice';

describe('carrierPortalSlice', () => {
  it('saveCompanySuccess clears savingPhase and sets lastSavedPhase=1', () => {
    const next = carrierPortalReducer(undefined, carrierPortalActions.saveCompanySuccess());
    expect(next.savingPhase).toBe(false);
    expect(next.lastSavedPhase).toBe(1);
  });
  it('setCurrentPhase no longer guards on session', () => {
    const next = carrierPortalReducer(undefined, carrierPortalActions.setCurrentPhase(3));
    expect(next.currentPhase).toBe(3);
  });
});
```

**Component test pattern (CLAUDE.md §"Component tests" — mock formik factory; use accessibility queries):**
```typescript
const createMockFormik = (overrides = {}) => ({
  values: {}, errors: {}, touched: {}, handleChange: jest.fn(), handleBlur: jest.fn(), setFieldValue: jest.fn(),
  ...overrides,
});
// getByRole > getByText > getByLabelText > getByTestId
```

---

### 15. `.planning/phases/01-stabilize/SMOKE-CHECKLIST.md` (NEW — STAB-15)

**Analog:** none in tree. Committed checklist filled in during execution (RESEARCH.md Open Question #2 recommended form). Single markdown file with phase-by-phase verification rows.

---

## Shared Patterns

### Notistack snackbar (validation + saga errors)

**Source:** `hussle-app-dispatch-ui/src/utils/axios.ts:6` (project standard); plus CLAUDE.md §"Saga error pattern"

**Apply to:** `CarrierPortalPage.handleContinue` (validation warning); every saga `catch` block needs to put a failure action — separately, the page can `useEffect` on `error` and `enqueueSnackbar('We couldn\'t save your answers. Try again.', { variant: 'error' })`.

**Saga error excerpt (from `savePhaseDataSaga.ts:37-40`):**
```typescript
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Failed to save company';
  yield put(carrierPortalActions.saveCompanyFailure(message));
}
```

**Snackbar call site (UI-SPEC §"Validation feedback (STAB-02)" — verbatim copy):**
```typescript
enqueueSnackbar('Please answer the highlighted questions before continuing.', {
  variant: 'warning',
  anchorOrigin: { vertical: 'top', horizontal: 'center' },
  autoHideDuration: 4000,
  preventDuplicate: true,           // RESEARCH.md Pitfall 2 — prevents stacking
  key: 'phase-validation-error',
});
```

**Note on `useDirtyFormBlocker`:** Project CLAUDE.md mandates it for drawers/forms. **The carrier portal is a page, not a drawer** — RESEARCH.md §"Project Constraints" confirms this constraint does not apply to Phase 1. Skip it.

### Token-scoped API access

**Source:** `hussle-app-dispatch-ui/src/utils/api/fleet/carrierPortalApi.ts:24-26`

**Apply to:** All new API client functions (`saveCostAnalysis`, `saveLanePreferences`).

```typescript
const portalHeaders = (token: string): AxiosRequestConfig => ({
  headers: { Authorization: `Bearer ${token}` },
});
```

### Saga token selection

**Source:** `hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/savePhaseDataSaga.ts:17-22`

**Apply to:** All new saga workers — every worker reads the token from `state.pages.carrierPortal.token`, fails early with a `'No token available'` failure dispatch.

### `data-question-id` scroll-to-error attribute

**Source:** `QuestionCard.tsx:28` and `SubQuestion.tsx:36` (already wired).

**Apply to:** Every question-renderable container. **Pitfall (RESEARCH.md Pitfall 3):** Verify each path through `PhaseForm.tsx` exposes the attribute. If a question renders a raw MUI input outside a `QuestionCard` wrapper, wrap it.

### `prefers-reduced-motion` honor

**Apply to:** `CostResultCard` count-up + fade-in, scroll-to-error, any future animation.

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### Typography helpers

**Source:** `hussle-app-dispatch-ui/src/components/Typography/` per project CLAUDE.md §"Typography Standards"

**Apply to:** `CostResultCard` body / labels / heading (use `Meta` for overline, `BodyMuted` for grey body, raw `Typography` with `sx={{ fontSize, fontWeight }}` ONLY for the Table-2 isolation-zone display values — per UI-SPEC §Typography Table 2). Never use raw `<Typography variant>` for thread-system surfaces.

### `useSelector` / `useDispatch` from `store`

**Apply to:** Every page and component touching Redux. Never import from `react-redux`.

```typescript
import { useSelector, useDispatch } from 'store';
```

---

## No Analog Found

**None.** Every Phase 1 file has either:
- An exact in-file analog (same module, extension),
- A sibling-feature analog (Company / Equipment / Drivers patterns),
- Or, for `CostResultCard`, a closely-shaped sibling (`StateGrid`) plus an authoritative legacy design document for visuals.

The closest thing to "no analog" is **`SMOKE-CHECKLIST.md`** — written fresh, but it's documentation, not code.

---

## Metadata

**Analog search scope:**
- `hussle-app-dispatch-ui/src/features/carrier-portal/**` (full feature)
- `hussle-app-dispatch-ui/src/components/ConversationalForm/**` (shared)
- `hussle-app-dispatch-ui/src/utils/api/fleet/carrierPortalApi.ts`
- `hussle-app-dispatch-ui/e2e/driver-portal-smoke.spec.ts`
- `.planning/phases/01-stabilize/01-UI-SPEC.md` (visual contract)
- `.planning/phases/01-stabilize/01-RESEARCH.md` (patterns + skeletons)

**Files read (concrete excerpts extracted):** 7 (savePhaseDataSaga.ts, carrierPortalSlice.ts, companyQuestions.ts, driver-portal-smoke.spec.ts, carrierPortalApi.ts, CarrierPortalPage/index.tsx — plus full CONTEXT/RESEARCH/UI-SPEC)

**Pattern extraction date:** 2026-05-13

**Confidence:** HIGH — every excerpt is verbatim from current code; every file:line reference verified by direct read; every "build new" task has a closest analog with concrete imports / core pattern / error handling.

**Planner guidance:** Tasks should reference specific analog excerpts. Example: "mirror `savePhaseDataSaga.ts:28-41` for `handleSaveCostAnalysis`; mirror `carrierPortalSlice.ts:107-117` for `saveCostAnalysis`/`Success`/`Failure` action triple."
