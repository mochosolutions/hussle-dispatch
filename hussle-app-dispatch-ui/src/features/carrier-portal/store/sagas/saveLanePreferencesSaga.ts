import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import { saveLanePreferencesV2, submitStepV2 } from 'utils/api/carrierPortal/v2';
import type { Session } from 'features/carrier-portal/engine';

import { carrierPortalV2Actions } from '../reducers/carrierPortalSlice';
import {
  advanceCurrentStep,
  extractErrorMessage,
  mergeSubmitStepResponse,
} from './sessionAdapters';

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleSaveLanePreferences(
  action: PayloadAction<Record<string, unknown>>,
): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(
        carrierPortalV2Actions.saveLanePreferencesFailure('No token available'),
      );
      return;
    }

    yield call(saveLanePreferencesV2, token, action.payload);
    yield put(carrierPortalV2Actions.saveLanePreferencesSuccess());

    // Lane-preferences save persists to its own endpoint; advance the wizard
    // via a follow-up submit-step so the user is moved to the next phase.
    const session: Session | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.session,
    );
    if (session?.currentStepId) {
      const raw: unknown = yield call(submitStepV2, token, {
        stepId: session.currentStepId,
        answers: {},
      });
      const merged = mergeSubmitStepResponse(session, raw);
      yield put(carrierPortalV2Actions.submitStepSuccess(advanceCurrentStep(merged)));
    }
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to save lane preferences');
    yield put(carrierPortalV2Actions.saveLanePreferencesFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* saveLanePreferencesSaga(): Generator {
  yield takeLatest(
    carrierPortalV2Actions.saveLanePreferences.type,
    handleSaveLanePreferences,
  );
}
