import { takeLatest } from 'redux-saga/effects';
import { vehiclePageSlice } from '../reducers/vehiclePageSlice';
import { assignDriverRequest, unassignDriverRequest } from '../reducers/vehiclePageSlice';
import { fetchVehiclesSaga } from './fetchVehiclesSaga';
import { fetchVehicleDetailsSaga } from './fetchVehicleDetailsSaga';
import { createVehicleSaga } from './createVehicleSaga';
import { updateVehicleSaga } from './updateVehicleSaga';
import { deleteVehicleSaga } from './deleteVehicleSaga';
import { assignDriverSaga } from './assignDriverSaga';
import { unassignDriverSaga } from './unassignDriverSaga';

export const { actions: vehiclePageActions } = vehiclePageSlice;

export function* vehicleSagaWatcher(): Generator {
  yield takeLatest(vehiclePageActions.fetchAllRequest.type, fetchVehiclesSaga);
  yield takeLatest(vehiclePageActions.fetchByIdRequest.type, fetchVehicleDetailsSaga);
  yield takeLatest(vehiclePageActions.createRequest.type, createVehicleSaga);
  yield takeLatest(vehiclePageActions.updateRequest.type, updateVehicleSaga);
  yield takeLatest(vehiclePageActions.deleteRequest.type, deleteVehicleSaga);
  yield takeLatest(assignDriverRequest.type, assignDriverSaga);
  yield takeLatest(unassignDriverRequest.type, unassignDriverSaga);
}
