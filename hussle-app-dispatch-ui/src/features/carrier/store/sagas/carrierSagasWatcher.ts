import { takeLatest } from 'redux-saga/effects';
import { fetchCarriersSaga } from './fetchCarriersSaga';
import { carrierPageSlice } from '../reducers/carrierNewPageSlice';
import { fetchCarrierDetailsSaga } from './fetchCarrierDetailsSaga';
import { createCarrierSaga } from './createCarrierSaga';
import { updateCarrierSaga } from './updateCarrierSaga';
import { deleteCarrierSaga } from './deleteCarrierSaga';
import { fetchCarrierNotesSaga } from './fetchCarrierNotesSaga';
import { createCarrierNoteSaga } from './createCarrierNoteSaga';
import { fetchCarrierDriversSaga } from './fetchCarrierDriversSaga';
import { fetchCarrierVehiclesSaga } from './fetchCarrierVehiclesSaga';
import {
  fetchCarrierNotesRequest,
  createCarrierNoteRequest,
} from '../reducers/carrierNotesSlice';
import {
  fetchCarrierDriversRequest,
  fetchCarrierVehiclesRequest,
} from '../reducers/carrierDetailActions';

export const { actions: carrierPageActions } = carrierPageSlice;

export function* carrierSagaWatcher(): Generator {
  yield takeLatest(carrierPageActions.fetchAllRequest.type, fetchCarriersSaga);
  yield takeLatest(carrierPageActions.fetchByIdRequest.type, fetchCarrierDetailsSaga);
  yield takeLatest(carrierPageActions.createRequest.type, createCarrierSaga);
  yield takeLatest(carrierPageActions.updateRequest.type, updateCarrierSaga);
  yield takeLatest(carrierPageActions.deleteRequest.type, deleteCarrierSaga);
  yield takeLatest(fetchCarrierNotesRequest.type, fetchCarrierNotesSaga);
  yield takeLatest(createCarrierNoteRequest.type, createCarrierNoteSaga);
  yield takeLatest(fetchCarrierDriversRequest.type, fetchCarrierDriversSaga);
  yield takeLatest(fetchCarrierVehiclesRequest.type, fetchCarrierVehiclesSaga);
}
