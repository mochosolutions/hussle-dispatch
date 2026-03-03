import { takeLatest } from 'redux-saga/effects';
import {
  fetchCarriersRequest,
  fetchCarrierDetailsRequest,
  createCarrierRequest,
  updateCarrierRequest,
  deleteCarrierRequest,
} from '../reducers/carrierPageSlice';
import { fetchCarriersSaga } from './fetchCarriersSaga';
import { fetchCarrierDetailsSaga } from './fetchCarrierDetailsSaga';
import { createCarrierSaga } from './createCarrierSaga';
import { updateCarrierSaga } from './updateCarrierSaga';
import { deleteCarrierSaga } from './deleteCarrierSaga';

export function* carrierSagaWatcher(): Generator {
  yield takeLatest(fetchCarriersRequest.type, fetchCarriersSaga);
  yield takeLatest(fetchCarrierDetailsRequest.type, fetchCarrierDetailsSaga);
  yield takeLatest(createCarrierRequest.type, createCarrierSaga);
  yield takeLatest(updateCarrierRequest.type, updateCarrierSaga);
  yield takeLatest(deleteCarrierRequest.type, deleteCarrierSaga);
}
