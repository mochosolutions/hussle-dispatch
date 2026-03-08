import { takeLatest } from 'redux-saga/effects';
import {
  fetchDriversRequest,
  fetchDriverDetailsRequest,
  createDriverRequest,
  updateDriverRequest,
  deleteDriverRequest,
} from '../reducers/driverPageSlice';
import { fetchDriversSaga } from './fetchDriversSaga';
import { fetchDriverDetailsSaga } from './fetchDriverDetailsSaga';
import { createDriverSaga } from './createDriverSaga';
import { updateDriverSaga } from './updateDriverSaga';
import { deleteDriverSaga } from './deleteDriverSaga';

export function* driverSagaWatcher(): Generator {
  yield takeLatest(fetchDriversRequest.type, fetchDriversSaga);
  yield takeLatest(fetchDriverDetailsRequest.type, fetchDriverDetailsSaga);
  yield takeLatest(createDriverRequest.type, createDriverSaga);
  yield takeLatest(updateDriverRequest.type, updateDriverSaga);
  yield takeLatest(deleteDriverRequest.type, deleteDriverSaga);
}
