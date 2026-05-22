import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import { saveCompanyV2, submitStepV2 } from 'utils/api/carrierPortal/v2';
import type { Session } from 'features/carrier-portal/engine';

import {
  carrierPortalV2Actions,
  type SaveCompanyPayload,
} from '../reducers/carrierPortalSlice';
import {
  advanceCurrentStep,
  extractErrorMessage,
  mergeSubmitStepResponse,
} from './sessionAdapters';

const COMPANY_STEP_ID = 'company-authority-question';

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleSaveCompany(action: PayloadAction<SaveCompanyPayload>): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(carrierPortalV2Actions.saveCompanyFailure('Session expired'));
      yield call(enqueueSnackbar, 'Session expired', { variant: 'error' });
      return;
    }

    yield call(saveCompanyV2, token, action.payload.fields);
    yield put(carrierPortalV2Actions.saveCompanySuccess());

    // Follow-up submitStep call advances currentStepId AND persists the
    // engine-relevant answers (hasMcAuthority + hasDba) so visibility
    // predicates on later steps still resolve correctly.
    const session: Session | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.session,
    );
    const existing = (session?.answers[COMPANY_STEP_ID] ?? {}) as Record<string, unknown>;
    const hasMcAuthority =
      action.payload.hasMcAuthority ?? (existing.hasMcAuthority as string | undefined);
    const hasDba = action.payload.hasDba ?? (existing.hasDba as string | undefined);

    const engineAnswers: Record<string, unknown> = {};
    if (hasMcAuthority !== undefined) {
      engineAnswers.hasMcAuthority = hasMcAuthority;
    }
    if (hasDba !== undefined) {
      engineAnswers.hasDba = hasDba;
    }

    const raw: unknown = yield call(submitStepV2, token, {
      stepId: COMPANY_STEP_ID,
      answers: engineAnswers,
    });

    if (session) {
      const merged = mergeSubmitStepResponse(session, raw);
      yield put(carrierPortalV2Actions.submitStepSuccess(advanceCurrentStep(merged)));
    }
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to save company information');
    yield put(carrierPortalV2Actions.saveCompanyFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* saveCompanySaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.saveCompany.type, handleSaveCompany);
}
