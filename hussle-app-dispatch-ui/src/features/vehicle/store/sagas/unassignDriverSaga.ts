import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { unassignDriver } from 'utils/api/fleet/vehicleApi';
import { updateVehicleSuccess, updateVehicleFailure } from '../reducers/vehiclePageSlice';
import { vehicleActions } from '../reducers/vehicleEntitySlice';

export function* unassignDriverSaga(
  action: PayloadAction<{ vehicleId: string }>,
): Generator {
  const { vehicleId } = action.payload;

  try {
    const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

    if (useMock) {
      yield put(vehicleActions.updateOne({ id: vehicleId, changes: { driverId: null } }));
      yield put(updateVehicleSuccess({ id: vehicleId }));
      yield call(enqueueSnackbar, 'Driver unassigned', { variant: 'success' });
      return;
    }

    const response = (yield call(
      unassignDriver,
      vehicleId,
    )) as SagaReturnType<typeof unassignDriver>;

    yield put(vehicleActions.updateOne({ id: vehicleId, changes: response.vehicle }));
    yield put(updateVehicleSuccess({ id: vehicleId }));
    yield call(enqueueSnackbar, 'Driver unassigned', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to unassign driver';
    yield put(updateVehicleFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
