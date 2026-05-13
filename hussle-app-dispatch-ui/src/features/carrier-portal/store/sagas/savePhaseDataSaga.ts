import { call, put, select, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import type {
  OnboardingSession,
  SaveCompanyRequest,
  SaveCostAnalysisRequest,
  SaveDriversRequest,
  SaveEquipmentRequest,
  SaveLanePreferencesRequest,
} from 'features/carrier-portal/types';
import { carrierPortalActions } from '../slices/carrierPortalSlice';
import * as api from '../../../../utils/api/fleet/carrierPortalApi';

// ---------------------------------------------------------------------------
// Token helper
// ---------------------------------------------------------------------------

function* getToken(): Generator {
  const token = (yield select(
    (state: RootState) => state.pages.carrierPortal.token,
  )) as string | null;
  return token;
}

// ---------------------------------------------------------------------------
// Workers
// ---------------------------------------------------------------------------

function* handleSaveCompany(action: PayloadAction<SaveCompanyRequest>): Generator {
  try {
    const token: string | null = yield* getToken();
    if (!token) {
      yield put(carrierPortalActions.saveCompanyFailure('No token available'));
      return;
    }
    yield call(api.saveCompany, token, action.payload);
    yield put(carrierPortalActions.saveCompanySuccess());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save company';
    yield put(carrierPortalActions.saveCompanyFailure(message));
  }
}

function* handleSaveEquipment(action: PayloadAction<SaveEquipmentRequest>): Generator {
  try {
    const token: string | null = yield* getToken();
    if (!token) {
      yield put(carrierPortalActions.saveEquipmentFailure('No token available'));
      return;
    }
    yield call(api.saveEquipment, token, action.payload);
    yield put(carrierPortalActions.saveEquipmentSuccess());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save equipment';
    yield put(carrierPortalActions.saveEquipmentFailure(message));
  }
}

function* handleSaveDrivers(action: PayloadAction<SaveDriversRequest>): Generator {
  try {
    const token: string | null = yield* getToken();
    if (!token) {
      yield put(carrierPortalActions.saveDriversFailure('No token available'));
      return;
    }
    yield call(api.saveDrivers, token, action.payload);
    yield put(carrierPortalActions.saveDriversSuccess());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save drivers';
    yield put(carrierPortalActions.saveDriversFailure(message));
  }
}

function* handleSaveCostAnalysis(action: PayloadAction<SaveCostAnalysisRequest>): Generator {
  try {
    const token: string | null = yield* getToken();
    if (!token) {
      yield put(carrierPortalActions.saveCostAnalysisFailure('No token available'));
      return;
    }
    yield call(api.saveCostAnalysis, token, action.payload);
    yield put(carrierPortalActions.saveCostAnalysisSuccess());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save cost analysis';
    yield put(carrierPortalActions.saveCostAnalysisFailure(message));
  }
}

function* handleSaveLanePreferences(
  action: PayloadAction<SaveLanePreferencesRequest>,
): Generator {
  try {
    const token: string | null = yield* getToken();
    if (!token) {
      yield put(carrierPortalActions.saveLanePreferencesFailure('No token available'));
      return;
    }
    yield call(api.saveLanePreferences, token, action.payload);
    yield put(carrierPortalActions.saveLanePreferencesSuccess());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save lane preferences';
    yield put(carrierPortalActions.saveLanePreferencesFailure(message));
  }
}

function* handleCompleteOnboarding(): Generator {
  try {
    const token: string | null = yield* getToken();
    if (!token) {
      yield put(carrierPortalActions.completeOnboardingFailure('No token available'));
      return;
    }
    const session: OnboardingSession = yield call(api.completeSession, token);
    yield put(carrierPortalActions.completeOnboardingSuccess(session));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to complete onboarding';
    yield put(carrierPortalActions.completeOnboardingFailure(message));
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* savePhaseDataSaga(): Generator {
  yield takeLatest(carrierPortalActions.saveCompany.type, handleSaveCompany);
  yield takeLatest(carrierPortalActions.saveEquipment.type, handleSaveEquipment);
  yield takeLatest(carrierPortalActions.saveDrivers.type, handleSaveDrivers);
  yield takeLatest(carrierPortalActions.saveCostAnalysis.type, handleSaveCostAnalysis);
  yield takeLatest(carrierPortalActions.saveLanePreferences.type, handleSaveLanePreferences);
  yield takeLatest(carrierPortalActions.completeOnboarding.type, handleCompleteOnboarding);
}
