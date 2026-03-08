import { takeLatest } from 'redux-saga/effects';
import { fetchCarriersSaga } from './fetchCarriersSaga';
import { carrierPageSlice } from '../reducers/carrierNewPageSlice';
export const { actions: carrierPageActions } = carrierPageSlice;
import { fetchCarrierDetailsSaga } from './fetchCarrierDetailsSaga';
// import { fetchCarrierOnboardingSaga } from './fetchCarrierOnboardingSaga';
import { createCarrierSaga } from './createCarrierSaga';
// import { updateCarrierSaga } from './updateCarrierSaga';
// import { deleteCarrierSaga } from './deleteCarrierSaga';

export function* carrierSagaWatcher(): Generator {
  yield takeLatest(carrierPageActions.fetchAllRequest.type, fetchCarriersSaga);
  yield takeLatest(carrierPageActions.fetchByIdRequest.type, fetchCarrierDetailsSaga);
  // yield takeLatest(fetchCarrierOnboardingRequest.type, fetchCarrierOnboardingSaga);
  yield takeLatest(carrierPageActions.createRequest.type, createCarrierSaga);
  // yield takeLatest(updateCarrierRequest.type, updateCarrierSaga);
  // yield takeLatest(deleteCarrierRequest.type, deleteCarrierSaga);
}
