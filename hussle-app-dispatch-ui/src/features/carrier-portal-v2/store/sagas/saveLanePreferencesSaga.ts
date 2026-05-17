import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import { saveLanePreferencesV2 } from 'utils/api/carrierPortal/v2';

import { carrierPortalV2Actions } from '../reducers/carrierPortalSlice';
import { extractErrorMessage } from './sessionAdapters';

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
