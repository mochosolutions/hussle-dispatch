import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { updateSettings } from 'utils/api/fleet/settingsApi';
import { updateSettingsSuccess, updateSettingsFailure } from '../reducers/settingsSlice';
import { settingsEntityActions } from '../reducers/settingsEntitySlice';
import type { UpdateSettingsRequestPayload } from '../../types';

export function* updateSettingsSaga(
  action: PayloadAction<UpdateSettingsRequestPayload>,
): Generator {
  try {
    const { values } = action.payload;

    const response = (yield call(updateSettings, values)) as SagaReturnType<typeof updateSettings>;

    yield put(settingsEntityActions.upsertOne(response.settings));
    yield put(updateSettingsSuccess(response.settings));
    yield put(notify({ message: 'Settings updated', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
    yield put(updateSettingsFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
