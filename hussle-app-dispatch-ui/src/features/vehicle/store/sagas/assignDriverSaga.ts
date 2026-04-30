import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { assignDriver } from 'utils/api/fleet/vehicleApi';
import {
  fetchVehicleDetailsRequest,
  fetchVehiclesRequest,
  updateVehicleSuccess,
  updateVehicleFailure,
} from '../reducers/vehiclePageSlice';
import { vehicleActions } from '../reducers/vehicleEntitySlice';

export function* assignDriverSaga(
  action: PayloadAction<{ vehicleId: string; driverId: string }>,
): Generator {
  const { vehicleId, driverId } = action.payload;

  try {
    const response = (yield call(assignDriver, vehicleId, driverId)) as SagaReturnType<
      typeof assignDriver
    >;

    yield put(vehicleActions.updateOne({ id: vehicleId, changes: response }));
    yield put(vehicleActions.upsertOne(response));
    yield put(fetchVehicleDetailsRequest({ id: vehicleId }));
    yield put(fetchVehiclesRequest({ page: 1, limit: 25 }));
    yield put(updateVehicleSuccess({ id: vehicleId }));
    yield put(notify({ message: 'Driver assigned', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign driver';
    yield put(updateVehicleFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
