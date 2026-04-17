import { takeLatest } from 'redux-saga/effects';
import {
  fetchDriversRequest,
  fetchDriverDetailsRequest,
  createDriverRequest,
  updateDriverRequest,
  deleteDriverRequest,
  fetchScheduleRequest,
  setWeeklyScheduleRequest,
  createOverrideRequest,
  deleteOverrideRequest,
} from '../reducers/driverPageSlice';
import { fetchDriversSaga } from './fetchDriversSaga';
import { fetchDriverDetailsSaga } from './fetchDriverDetailsSaga';
import { createDriverSaga } from './createDriverSaga';
import { updateDriverSaga } from './updateDriverSaga';
import { deleteDriverSaga } from './deleteDriverSaga';
import { fetchDriverScheduleSaga } from './fetchDriverScheduleSaga';
import { setWeeklyScheduleSaga } from './setWeeklyScheduleSaga';
import { createOverrideSaga } from './createOverrideSaga';
import { deleteOverrideSaga } from './deleteOverrideSaga';

export function* driverSagaWatcher(): Generator {
  yield takeLatest(fetchDriversRequest.type, fetchDriversSaga);
  yield takeLatest(fetchDriverDetailsRequest.type, fetchDriverDetailsSaga);
  yield takeLatest(createDriverRequest.type, createDriverSaga);
  yield takeLatest(updateDriverRequest.type, updateDriverSaga);
  yield takeLatest(deleteDriverRequest.type, deleteDriverSaga);
  yield takeLatest(fetchScheduleRequest.type, fetchDriverScheduleSaga);
  yield takeLatest(setWeeklyScheduleRequest.type, setWeeklyScheduleSaga);
  yield takeLatest(createOverrideRequest.type, createOverrideSaga);
  yield takeLatest(deleteOverrideRequest.type, deleteOverrideSaga);
}
