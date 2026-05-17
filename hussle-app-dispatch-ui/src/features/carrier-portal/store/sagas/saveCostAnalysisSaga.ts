import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import { saveCostAnalysisV2 } from 'utils/api/carrierPortal/v2';

import { carrierPortalV2Actions } from '../reducers/carrierPortalSlice';
import { extractErrorMessage } from './sessionAdapters';

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleSaveCostAnalysis(
  action: PayloadAction<Record<string, unknown>>,
): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(carrierPortalV2Actions.saveCostAnalysisFailure('No token available'));
      return;
    }

    yield call(saveCostAnalysisV2, token, action.payload);
    yield put(carrierPortalV2Actions.saveCostAnalysisSuccess());
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to save cost analysis');
    yield put(carrierPortalV2Actions.saveCostAnalysisFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* saveCostAnalysisSaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.saveCostAnalysis.type, handleSaveCostAnalysis);
}
