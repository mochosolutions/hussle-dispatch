import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { fetchSettings } from 'utils/api/fleet/settingsApi';
import { fetchSettingsSuccess, fetchSettingsFailure } from '../reducers/settingsSlice';
import { settingsEntityActions } from '../reducers/settingsEntitySlice';

export function* fetchSettingsSaga(): Generator {
  try {
    const response = (yield call(fetchSettings)) as SagaReturnType<typeof fetchSettings>;

    yield put(settingsEntityActions.setAll([response.settings]));
    yield put(fetchSettingsSuccess(response.settings));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load settings';
    yield put(fetchSettingsFailure(errorMessage));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
