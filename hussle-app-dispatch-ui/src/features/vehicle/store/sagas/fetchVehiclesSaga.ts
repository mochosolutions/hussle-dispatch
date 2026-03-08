import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getVehicles } from 'utils/api/fleet/vehicleApi';
import { MOCK_VEHICLES, MOCK_VEHICLES_META } from '../../mockData';
import {
  fetchVehiclesSuccess,
  fetchVehiclesFailure,
} from '../reducers/vehiclePageSlice';
import { vehicleActions } from '../reducers/vehicleEntitySlice';

interface FetchVehiclesPayload {
  page?: number;
  limit?: number;
  search?: string;
  carrierId?: string;
}

export function* fetchVehiclesSaga(action: PayloadAction<FetchVehiclesPayload>): Generator {
  try {
    const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
    console.log("useMock in fetchVehiclesSaga:", useMock);

    if (useMock) {
      yield put(vehicleActions.setAll(MOCK_VEHICLES));
      yield put(fetchVehiclesSuccess({ meta: MOCK_VEHICLES_META }));
      return;
    }

    const response = (yield call(
      getVehicles,
      action.payload,
    )) as SagaReturnType<typeof getVehicles>;

    yield put(vehicleActions.setAll(response.data));
    yield put(
      fetchVehiclesSuccess({
        meta: response.meta,
      }),
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load vehicles';
    yield put(fetchVehiclesFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
