import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
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
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
