// ---------------------------------------------------------------------------
// completeSessionSaga (B9) — final terminal step.
//
// Calls POST /carrier-portal/session/complete which sets:
//   - OnboardingSession.completedAt = now()
//   - Carrier.status = ACTIVE
//
// Unlike other save-* sagas this does NOT call submitStepV2 — `complete` is
// the terminal step and there is no next step to advance to.
// ---------------------------------------------------------------------------

import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';

import type { RootState } from 'store';
import { completeSessionV2, type CompleteSessionResponseV2 } from 'utils/api/carrierPortal/v2';

import { carrierPortalV2Actions } from '../reducers/carrierPortalSlice';
import { extractErrorMessage } from './sessionAdapters';

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleCompleteSession(): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(carrierPortalV2Actions.completeSessionFailure('Session expired'));
      yield call(enqueueSnackbar, 'Session expired', { variant: 'error' });
      return;
    }

    const response: CompleteSessionResponseV2 = yield call(completeSessionV2, token);
    yield put(
      carrierPortalV2Actions.completeSessionSuccess({
        completedAt: response.completedAt,
      }),
    );
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to complete onboarding');
    yield put(carrierPortalV2Actions.completeSessionFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* completeSessionSaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.completeSession.type, handleCompleteSession);
}
