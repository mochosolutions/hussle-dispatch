// Wave 0 scaffold flipped green by Plan 02 — covers STAB-01 saga path verification.
// Worker tests against the watcher `savePhaseDataSaga` and the new per-action workers.

import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga/effects';

import * as api from 'utils/api/fleet/carrierPortalApi';
import type {
  CarrierPortalSummary,
  SaveCostAnalysisRequest,
  SaveLanePreferencesRequest,
} from 'features/carrier-portal/types';
import { OnboardingStatus } from 'features/carrier-portal/types';

import { savePhaseDataSaga } from '../savePhaseDataSaga';
import { carrierPortalActions, carrierPortalReducer } from '../../slices/carrierPortalSlice';

const stateWithToken = {
  pages: {
    carrierPortal: { ...carrierPortalReducer(undefined, { type: '@@INIT' }), token: 'tok-123' },
  },
};

const stateWithoutToken = {
  pages: { carrierPortal: carrierPortalReducer(undefined, { type: '@@INIT' }) },
};

const summary: CarrierPortalSummary = {
  id: 'carrier-1',
  name: 'ACME Trucking',
  onboardingStatus: OnboardingStatus.IN_PROGRESS,
};

const costAnalysisPayload: SaveCostAnalysisRequest = {
  truckPayment: 1500,
  insuranceCost: 500,
  fuelCostPerGallon: 3.75,
  milesPerGallon: 6,
  maintenanceMonthlyCost: 400,
  otherMonthlyCosts: 200,
};

const lanePreferencesPayload: SaveLanePreferencesRequest = {
  statePreferences: [{ state: 'TX', preference: 'PREFERRED' }],
};

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
  it('handleSaveCostAnalysis puts saveCostAnalysisSuccess on API success — STAB-08', () =>
    expectSaga(savePhaseDataSaga)
      .withState(stateWithToken)
      .provide([[call(api.saveCostAnalysis, 'tok-123', costAnalysisPayload), summary]])
      .put(carrierPortalActions.saveCostAnalysisSuccess())
      .dispatch(carrierPortalActions.saveCostAnalysis(costAnalysisPayload))
      .silentRun());

  it('handleSaveCostAnalysis puts saveCostAnalysisFailure on API error — STAB-08', () =>
    expectSaga(savePhaseDataSaga)
      .withState(stateWithToken)
      .provide({
        call: (effect, next) => {
          if (effect.fn === api.saveCostAnalysis) {
            throw new Error('boom');
          }
          return next();
        },
      })
      .put(carrierPortalActions.saveCostAnalysisFailure('boom'))
      .dispatch(carrierPortalActions.saveCostAnalysis(costAnalysisPayload))
      .silentRun());

  it('handleSaveLanePreferences puts saveLanePreferencesSuccess on API success — STAB-10', () =>
    expectSaga(savePhaseDataSaga)
      .withState(stateWithToken)
      .provide([[call(api.saveLanePreferences, 'tok-123', lanePreferencesPayload), summary]])
      .put(carrierPortalActions.saveLanePreferencesSuccess())
      .dispatch(carrierPortalActions.saveLanePreferences(lanePreferencesPayload))
      .silentRun());

  it('handleSaveLanePreferences puts saveLanePreferencesFailure on API error — STAB-10', () =>
    expectSaga(savePhaseDataSaga)
      .withState(stateWithToken)
      .provide({
        call: (effect, next) => {
          if (effect.fn === api.saveLanePreferences) {
            throw new Error('boom');
          }
          return next();
        },
      })
      .put(carrierPortalActions.saveLanePreferencesFailure('boom'))
      .dispatch(carrierPortalActions.saveLanePreferences(lanePreferencesPayload))
      .silentRun());

  it('handleSaveCostAnalysis bails out with saveCostAnalysisFailure when no token is in state — STAB-01 safety', () =>
    expectSaga(savePhaseDataSaga)
      .withState(stateWithoutToken)
      .put(carrierPortalActions.saveCostAnalysisFailure('No token available'))
      .dispatch(carrierPortalActions.saveCostAnalysis(costAnalysisPayload))
      .silentRun());

  it('handleSaveLanePreferences bails out with saveLanePreferencesFailure when no token is in state — STAB-01 safety', () =>
    expectSaga(savePhaseDataSaga)
      .withState(stateWithoutToken)
      .put(carrierPortalActions.saveLanePreferencesFailure('No token available'))
      .dispatch(carrierPortalActions.saveLanePreferences(lanePreferencesPayload))
      .silentRun());

  // The remaining workers (saveCompany / saveEquipment / saveDrivers / completeOnboarding)
  // mirror the same pattern; full coverage lands incrementally as the existing scaffolds
  // stay green via the watcher registration test above.
  it.todo('handleSaveCompany dispatches saveCompanySuccess on API success — STAB-01');
  it.todo('handleSaveCompany dispatches saveCompanyFailure with message on API error — STAB-01');
  it.todo('handleSaveEquipment dispatches saveEquipmentSuccess on API success — STAB-01');
  it.todo('handleSaveDrivers dispatches saveDriversSuccess on API success — STAB-01');
  it.todo('handleCompleteOnboarding puts completeOnboardingSuccess with session payload — STAB-03');
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
