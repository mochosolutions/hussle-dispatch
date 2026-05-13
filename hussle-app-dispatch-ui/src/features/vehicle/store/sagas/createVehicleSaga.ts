import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getNavigate } from 'utils/getNavigate';
import { createVehicle } from 'utils/api/fleet/vehicleApi';
import type { CreateVehicleInput } from 'features/carrier/types';
import type { CreateRequestPayload } from '@mocho/ui/redux';
import {
  createVehicleSuccess,
  createVehicleFailure,
} from '../reducers/vehiclePageSlice';
import { vehicleActions } from '../reducers/vehicleEntitySlice';

export function* createVehicleSaga(
  action: PayloadAction<CreateRequestPayload<CreateVehicleInput>>,
): Generator {
  try {
    const { data } = action.payload;

    const response = (yield call(
      createVehicle,
      data,
    )) as SagaReturnType<typeof createVehicle>;

    yield put(vehicleActions.addOne(response));
    yield put(createVehicleSuccess({}));

    yield put(notify({ message: 'Vehicle created', variant: 'success' }));

    const { redirectTo, onCreated } = action.payload;
    if (onCreated) {
      onCreated(response.id);
    }
    if (redirectTo) {
      const navigate = (yield call(getNavigate)) as (path: string) => void;
      yield call(navigate, redirectTo);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create vehicle';
    yield put(createVehicleFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
