// Wave 0 scaffold — covers STAB-01 saga path verification.
// Worker tests against the watcher `savePhaseDataSaga` and the per-action workers.
// `it.todo` placeholders flip to real assertions as feature plans land in Waves 1–5.

import { expectSaga } from 'redux-saga-test-plan';

import { savePhaseDataSaga } from '../savePhaseDataSaga';
import { carrierPortalActions } from '../../slices/carrierPortalSlice';

// ---------------------------------------------------------------------------
// Watcher wiring — verifies the watcher takeLatest's on the right action types.
// ---------------------------------------------------------------------------

describe('savePhaseDataSaga (watcher)', () => {
  it('is an exported generator function', () => {
    // Arrange / Act
    const iter = savePhaseDataSaga();

    // Assert — duck-type the generator shape
    expect(typeof iter.next).toBe('function');
    expect(typeof iter.throw).toBe('function');
    iter.return(undefined);
  });

  it('terminates the takeLatest registration sequence without throwing — STAB-01 baseline', () =>
    expectSaga(savePhaseDataSaga).silentRun(50));
});

// ---------------------------------------------------------------------------
// Worker behavior — placeholder map.
// Real assertions land in Plan 02 once `lastSavedPhase` + rising-edge are wired.
// ---------------------------------------------------------------------------

describe('savePhaseDataSaga workers', () => {
  it.todo('handleSaveCompany dispatches saveCompanySuccess on API success — STAB-01');
  it.todo('handleSaveCompany dispatches saveCompanyFailure with message on API error — STAB-01');
  it.todo('handleSaveEquipment dispatches saveEquipmentSuccess on API success — STAB-01');
  it.todo('handleSaveDrivers dispatches saveDriversSuccess on API success — STAB-01');
  it.todo('handleSaveCostAnalysis puts saveCostAnalysisSuccess with API result — STAB-08');
  it.todo('handleSaveLanePreferences puts saveLanePreferencesSuccess on API success — STAB-10');
  it.todo('handleCompleteOnboarding puts completeOnboardingSuccess with session payload — STAB-03');
  it.todo('every worker bails out with *Failure when no token is in state — STAB-01 safety');
});

// Sanity exports — keeps tree-shaking honest and ensures action creators referenced
// by future tests are kept in the module graph.
describe('carrierPortalActions exposed for saga tests', () => {
  it('exposes saveCompany/saveCostAnalysis/completeOnboarding action creators', () => {
    expect(typeof carrierPortalActions.saveCompany).toBe('function');
    expect(typeof carrierPortalActions.saveCostAnalysis).toBe('function');
    expect(typeof carrierPortalActions.completeOnboarding).toBe('function');
  });
});
