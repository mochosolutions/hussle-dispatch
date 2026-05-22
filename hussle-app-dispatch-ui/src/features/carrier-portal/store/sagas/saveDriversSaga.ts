import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import { saveDriversV2, submitStepV2 } from 'utils/api/carrierPortal/v2';
import type { Session } from 'features/carrier-portal/engine';

import {
  carrierPortalV2Actions,
  type SaveDriversPayload,
} from '../reducers/carrierPortalSlice';
import {
  advanceCurrentStep,
  extractErrorMessage,
  mergeSubmitStepResponse,
} from './sessionAdapters';

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleSaveDrivers(action: PayloadAction<SaveDriversPayload>): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(carrierPortalV2Actions.saveDriversFailure('Session expired'));
      yield call(enqueueSnackbar, 'Session expired', { variant: 'error' });
      return;
    }

    const { hasAdditionalDrivers, drivers } = action.payload;

    yield call(saveDriversV2, token, { hasAdditionalDrivers, drivers });
    yield put(carrierPortalV2Actions.saveDriversSuccess());

    // Follow-up submitStep call advances currentStepId AND persists drivers
    // in session.answers so engine predicates on later steps can still
    // resolve against driver data. The current step could be either
    // 'drivers-list' or 'drivers-solo-confirm' — read from session rather
    // than hard-coding so the saga isn't coupled to which branch dispatched.
    const session: Session | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.session,
    );

    if (!session || !session.currentStepId) {
      return;
    }

    const raw: unknown = yield call(submitStepV2, token, {
      stepId: session.currentStepId,
      answers: { hasAdditionalDrivers, drivers },
    });

    const merged = mergeSubmitStepResponse(session, raw);
    yield put(carrierPortalV2Actions.submitStepSuccess(advanceCurrentStep(merged)));
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to save drivers');
    yield put(carrierPortalV2Actions.saveDriversFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* saveDriversSaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.saveDrivers.type, handleSaveDrivers);
}
