import { takeLatest } from 'redux-saga/effects';
import { fetchSettingsSaga } from './fetchSettingsSaga';
import { updateSettingsSaga } from './updateSettingsSaga';
import { fetchSettingsRequest, updateSettingsRequest } from '../reducers/settingsSlice';

export function* settingsSagaWatcher(): Generator {
  yield takeLatest(fetchSettingsRequest.type, fetchSettingsSaga);
  yield takeLatest(updateSettingsRequest.type, updateSettingsSaga);
}
