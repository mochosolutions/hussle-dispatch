import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getVehicleLoads } from 'utils/api/fleet/vehicleApi';
import {
  fetchVehicleLoadHistorySuccess,
  fetchVehicleLoadHistoryFailure,
} from '../reducers/vehicleLoadHistorySlice';

export function* fetchVehicleLoadHistorySaga(
  action: PayloadAction<{ vehicleId: string }>,
): Generator {
  const { vehicleId } = action.payload;

  try {
    const response = (yield call(
      getVehicleLoads,
      vehicleId,
    )) as SagaReturnType<typeof getVehicleLoads>;

    yield put(fetchVehicleLoadHistorySuccess({ vehicleId, loads: response.data }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load vehicle load history';
    yield put(fetchVehicleLoadHistoryFailure({ vehicleId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
