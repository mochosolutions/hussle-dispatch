import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import type { Session } from 'features/carrier-portal/engine';
import { submitStepV2 } from 'utils/api/carrierPortal/v2';

import { carrierPortalV2Actions } from '../reducers/carrierPortalSlice';
import {
  extractErrorMessage,
  extractFieldLockError,
  mergeSubmitStepResponse,
} from './sessionAdapters';

interface SubmitStepPayload {
  stepId: string;
  answers: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleSubmitStep(action: PayloadAction<SubmitStepPayload>): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(
        carrierPortalV2Actions.submitStepFailure({ error: 'No token available' }),
      );
      return;
    }

    const raw: unknown = yield call(submitStepV2, token, action.payload);

    const previous: Session | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.session,
    );
    const merged = previous
      ? mergeSubmitStepResponse(previous, raw)
      : mergeSubmitStepResponse(
          {
            id: '',
            carrierId: '',
            currentStepId: null,
            completedStepIds: [],
            answers: {},
            invitation: { email: null },
          },
          raw,
        );

    yield put(carrierPortalV2Actions.submitStepSuccess(merged));
  } catch (error: unknown) {
    const lockError = extractFieldLockError(error);
    if (lockError) {
      yield put(
        carrierPortalV2Actions.submitStepFailure({
          error: lockError.message,
          code: lockError.code,
          field: lockError.field,
        }),
      );
      yield call(
        enqueueSnackbar,
        'This field is locked after the agreement is signed.',
        { variant: 'warning' },
      );
      return;
    }
    const message = extractErrorMessage(error, 'Failed to submit step');
    yield put(carrierPortalV2Actions.submitStepFailure({ error: message }));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* submitStepSaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.submitStep.type, handleSubmitStep);
}
