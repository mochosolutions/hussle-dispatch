import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { updateVehicle } from 'utils/api/fleet/vehicleApi';
import type { UpdateVehicleInput } from 'features/carrier/types';
import {
  updateVehicleSuccess,
  updateVehicleFailure,
} from '../reducers/vehiclePageSlice';
import { vehicleActions } from '../reducers/vehicleEntitySlice';

export function* updateVehicleSaga(
  action: PayloadAction<{ id: string; data: UpdateVehicleInput }>,
): Generator {
  try {
    const { id, data } = action.payload;
    const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

    if (useMock) {
      yield put(vehicleActions.updateOne({ id, changes: data }));
      yield put(updateVehicleSuccess({ id }));
      yield call(enqueueSnackbar, 'Vehicle updated', { variant: 'success' });
      return;
    }

    const response = (yield call(
      updateVehicle,
      id,
      data,
    )) as SagaReturnType<typeof updateVehicle>;

    yield put(vehicleActions.updateOne({ id, changes: response.vehicle }));
    yield put(updateVehicleSuccess({ id }));

    yield call(enqueueSnackbar, 'Vehicle updated', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update vehicle';
    yield put(updateVehicleFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
