// ---------------------------------------------------------------------------
// US-15 T-41 — Carrier Portal V2 saga tests (redux-saga-test-plan).
//
// Coverage:
//   - submitStepSaga       — happy, 422 FIELD_LOCKED (warning toast), generic error
//   - fetchAgreementSaga   — happy, error
//   - saveCostAnalysisSaga — happy, error
//   - saveLanePreferencesSaga — happy, error
// ---------------------------------------------------------------------------

import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';

import type { Session } from 'features/carrier-portal/engine';

import { fetchAgreementSaga } from '../fetchAgreementSaga';
import { saveCostAnalysisSaga } from '../saveCostAnalysisSaga';
import { saveLanePreferencesSaga } from '../saveLanePreferencesSaga';
import { submitStepSaga } from '../submitStepSaga';
import {
  carrierPortalV2Actions,
  carrierPortalV2Reducer,
} from '../../reducers/carrierPortalSlice';
import * as api from 'utils/api/carrierPortal/v2';

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

// ---------------------------------------------------------------------------
// State fixtures
// ---------------------------------------------------------------------------

const existingSession: Session = {
  id: 'session-1',
  carrierId: 'carrier-1',
  currentStepId: 'welcome-segmentation',
  completedStepIds: [],
  answers: {},
  invitation: { email: 'driver@example.com' },
  agreement: {
    id: 'agreement-1',
    status: 'PENDING',
    embedUrl: null,
    signedFieldsLocked: false,
  },
};

const buildState = (overrides: Partial<{ token: string | null; session: Session | null }> = {}) => {
  const base = carrierPortalV2Reducer(undefined, { type: '@@INIT' });
  return {
    pages: {
      carrierPortalV2: {
        ...base,
        token: overrides.token ?? 'tok-123',
        session: overrides.session ?? existingSession,
      },
    },
  };
};

const submitStepResponse = {
  id: 'session-1',
  carrierId: 'carrier-1',
  currentStepId: 'company-info',
  completedStepIds: ['welcome-segmentation'],
  answers: { 'welcome-segmentation': { carrier_type: 'owner_operator' } },
};

// ---------------------------------------------------------------------------
// submitStepSaga
// ---------------------------------------------------------------------------

describe('submitStepSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches submitStepSuccess with merged engine session on API success', () =>
    expectSaga(submitStepSaga)
      .withState(buildState())
      .provide([
        [
          call(api.submitStepV2, 'tok-123', {
            stepId: 'welcome-segmentation',
            answers: { carrier_type: 'owner_operator' },
          }),
          submitStepResponse,
        ],
      ])
      .put(
        carrierPortalV2Actions.submitStepSuccess({
          ...existingSession,
          id: 'session-1',
          carrierId: 'carrier-1',
          currentStepId: 'company-info',
          completedStepIds: ['welcome-segmentation'],
          answers: { 'welcome-segmentation': { carrier_type: 'owner_operator' } },
        }),
      )
      .dispatch(
        carrierPortalV2Actions.submitStep({
          stepId: 'welcome-segmentation',
          answers: { carrier_type: 'owner_operator' },
        }),
      )
      .silentRun());

  it('dispatches submitStepFailure with code+field and warning toast on 422 FIELD_LOCKED', () => {
    const lockError = Object.assign(new Error('Field locked'), {
      response: {
        data: {
          errors: [
            {
              message: 'Field is locked after agreement signed',
              code: 'FIELD_LOCKED',
              field: 'company.legalName',
            },
          ],
        },
      },
    });
    return expectSaga(submitStepSaga)
      .withState(buildState())
      .provide({
        call: (effect, next) => {
          if (effect.fn === api.submitStepV2) {
            throw lockError;
          }
          return next();
        },
      })
      .put(
        carrierPortalV2Actions.submitStepFailure({
          error: 'Field is locked after agreement signed',
          code: 'FIELD_LOCKED',
          field: 'company.legalName',
        }),
      )
      .call(
        enqueueSnackbar,
        'This field is locked after the agreement is signed.',
        { variant: 'warning' },
      )
      .dispatch(
        carrierPortalV2Actions.submitStep({
          stepId: 'company-info',
          answers: { legalName: 'New Name' },
        }),
      )
      .silentRun();
  });

  it('dispatches submitStepFailure with generic error message + error toast on unknown error', () =>
    expectSaga(submitStepSaga)
      .withState(buildState())
      .provide({
        call: (effect, next) => {
          if (effect.fn === api.submitStepV2) {
            throw new Error('boom');
          }
          return next();
        },
      })
      .put(carrierPortalV2Actions.submitStepFailure({ error: 'boom' }))
      .call(enqueueSnackbar, 'boom', { variant: 'error' })
      .dispatch(
        carrierPortalV2Actions.submitStep({
          stepId: 'welcome-segmentation',
          answers: { carrier_type: 'owner_operator' },
        }),
      )
      .silentRun());
});

// ---------------------------------------------------------------------------
// fetchAgreementSaga
// ---------------------------------------------------------------------------

describe('fetchAgreementSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches fetchAgreementSuccess with projected agreement on API success', () => {
    const snapshot = {
      id: 'agreement-2',
      status: 'SIGNED',
      embedUrl: 'https://docu/embed/abc',
      signedFieldsLocked: true,
    };
    return expectSaga(fetchAgreementSaga)
      .withState(buildState())
      .provide([[call(api.getAgreementV2, 'tok-123', 'DISPATCH_AGREEMENT'), snapshot]])
      .put(
        carrierPortalV2Actions.fetchAgreementSuccess({
          id: 'agreement-2',
          status: 'SIGNED',
          embedUrl: 'https://docu/embed/abc',
          signedFieldsLocked: true,
        }),
      )
      .dispatch(
        carrierPortalV2Actions.fetchAgreement({ templateKey: 'DISPATCH_AGREEMENT' }),
      )
      .silentRun();
  });

  it('dispatches fetchAgreementFailure + error toast on API error', () =>
    expectSaga(fetchAgreementSaga)
      .withState(buildState())
      .provide({
        call: (effect, next) => {
          if (effect.fn === api.getAgreementV2) {
            throw new Error('network down');
          }
          return next();
        },
      })
      .put(carrierPortalV2Actions.fetchAgreementFailure('network down'))
      .call(enqueueSnackbar, 'network down', { variant: 'error' })
      .dispatch(
        carrierPortalV2Actions.fetchAgreement({ templateKey: 'DISPATCH_AGREEMENT' }),
      )
      .silentRun());
});

// ---------------------------------------------------------------------------
// saveCostAnalysisSaga
// ---------------------------------------------------------------------------

describe('saveCostAnalysisSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const payload = { overhead: { rentMonthly: 1000 } };

  it('dispatches saveCostAnalysisSuccess on API success', () =>
    expectSaga(saveCostAnalysisSaga)
      .withState(buildState())
      .provide([[call(api.saveCostAnalysisV2, 'tok-123', payload), {}]])
      .put(carrierPortalV2Actions.saveCostAnalysisSuccess())
      .dispatch(carrierPortalV2Actions.saveCostAnalysis(payload))
      .silentRun());

  it('dispatches saveCostAnalysisFailure + error toast on API error', () =>
    expectSaga(saveCostAnalysisSaga)
      .withState(buildState())
      .provide({
        call: (effect, next) => {
          if (effect.fn === api.saveCostAnalysisV2) {
            throw new Error('bad payload');
          }
          return next();
        },
      })
      .put(carrierPortalV2Actions.saveCostAnalysisFailure('bad payload'))
      .call(enqueueSnackbar, 'bad payload', { variant: 'error' })
      .dispatch(carrierPortalV2Actions.saveCostAnalysis(payload))
      .silentRun());
});

// ---------------------------------------------------------------------------
// saveLanePreferencesSaga
// ---------------------------------------------------------------------------

describe('saveLanePreferencesSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const payload = { fleet: { preferredStates: ['TX'] }, overrides: {} };

  it('dispatches saveLanePreferencesSuccess on API success', () =>
    expectSaga(saveLanePreferencesSaga)
      .withState(buildState())
      .provide([[call(api.saveLanePreferencesV2, 'tok-123', payload), {}]])
      .put(carrierPortalV2Actions.saveLanePreferencesSuccess())
      .dispatch(carrierPortalV2Actions.saveLanePreferences(payload))
      .silentRun());

  it('dispatches saveLanePreferencesFailure + error toast on API error', () =>
    expectSaga(saveLanePreferencesSaga)
      .withState(buildState())
      .provide({
        call: (effect, next) => {
          if (effect.fn === api.saveLanePreferencesV2) {
            throw new Error('rejected');
          }
          return next();
        },
      })
      .put(carrierPortalV2Actions.saveLanePreferencesFailure('rejected'))
      .call(enqueueSnackbar, 'rejected', { variant: 'error' })
      .dispatch(carrierPortalV2Actions.saveLanePreferences(payload))
      .silentRun());
});
