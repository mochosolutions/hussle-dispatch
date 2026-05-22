import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import { saveEquipmentV2, submitStepV2 } from 'utils/api/carrierPortal/v2';
import type { Session } from 'features/carrier-portal/engine';

import {
  carrierPortalV2Actions,
  type SaveEquipmentPayload,
} from '../reducers/carrierPortalSlice';
import {
  advanceCurrentStep,
  extractErrorMessage,
  mergeSubmitStepResponse,
} from './sessionAdapters';

const EQUIPMENT_STEP_ID = 'equipment-entry';

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleSaveEquipment(action: PayloadAction<SaveEquipmentPayload>): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(carrierPortalV2Actions.saveEquipmentFailure('Session expired'));
      yield call(enqueueSnackbar, 'Session expired', { variant: 'error' });
      return;
    }

    yield call(saveEquipmentV2, token, { vehicles: action.payload.vehicles });
    yield put(carrierPortalV2Actions.saveEquipmentSuccess());

    // Follow-up submitStep call advances currentStepId AND persists vehicles
    // in session.answers so engine predicates on later steps can still
    // resolve against equipment data.
    const session: Session | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.session,
    );

    const raw: unknown = yield call(submitStepV2, token, {
      stepId: EQUIPMENT_STEP_ID,
      answers: { vehicles: action.payload.vehicles },
    });

    if (session) {
      const merged = mergeSubmitStepResponse(session, raw);
      yield put(carrierPortalV2Actions.submitStepSuccess(advanceCurrentStep(merged)));
    }
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to save equipment');
    yield put(carrierPortalV2Actions.saveEquipmentFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* saveEquipmentSaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.saveEquipment.type, handleSaveEquipment);
}
