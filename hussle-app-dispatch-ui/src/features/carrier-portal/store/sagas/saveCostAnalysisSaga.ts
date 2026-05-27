import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import { saveCostAnalysisV2, submitStepV2 } from 'utils/api/carrierPortal/v2';
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

    // Cost-analysis save persists the calculator payload to its own endpoint,
    // but the wizard advance happens through the standard submit-step flow.
    // Without this second call the user lands back on cost-analysis on
    // successful save and can't reach the next phase.
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
