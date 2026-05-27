import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getVehicles } from 'utils/api/fleet/vehicleApi';
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
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
