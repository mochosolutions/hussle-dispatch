import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
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
    yield put(fetchVehicleDetailsRequest({ id: vehicleId }));
    yield put(fetchVehiclesRequest({ page: 1, limit: 25 }));
    yield put(updateVehicleSuccess({ id: vehicleId }));
    yield call(enqueueSnackbar, 'Driver assigned', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign driver';
    yield put(updateVehicleFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
