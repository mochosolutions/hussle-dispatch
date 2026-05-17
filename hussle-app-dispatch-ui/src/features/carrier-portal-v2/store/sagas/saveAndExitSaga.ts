import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import { submitStepV2 } from 'utils/api/carrierPortal/v2';

import { carrierPortalV2Actions } from '../reducers/carrierPortalSlice';
import { extractErrorMessage } from './sessionAdapters';

interface SaveAndExitPayload {
  stepId: string;
  answers: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Worker — persists current step answers then signals the UI to navigate out.
// ---------------------------------------------------------------------------

function* handleSaveAndExit(action: PayloadAction<SaveAndExitPayload>): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(carrierPortalV2Actions.saveAndExitFailure('No token available'));
      return;
    }

    yield call(submitStepV2, token, action.payload);
    yield put(carrierPortalV2Actions.saveAndExitSuccess());
    yield call(enqueueSnackbar, 'Progress saved. You can resume from your invite link.', {
      variant: 'success',
    });
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to save progress');
    yield put(carrierPortalV2Actions.saveAndExitFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* saveAndExitSaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.saveAndExit.type, handleSaveAndExit);
}
