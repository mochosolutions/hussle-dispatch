import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { createVehicle } from 'utils/api/fleet/vehicleApi';
import type { CreateVehicleInput } from 'features/carrier/types';
import {
  createVehicleSuccess,
  createVehicleFailure,
} from '../reducers/vehiclePageSlice';
import { vehicleActions } from '../reducers/vehicleEntitySlice';

export function* createVehicleSaga(
  action: PayloadAction<{ data: CreateVehicleInput }>,
): Generator {
  try {
    const { data } = action.payload;

    const response = (yield call(
      createVehicle,
      data,
    )) as SagaReturnType<typeof createVehicle>;

    yield put(vehicleActions.addOne(response));
    yield put(createVehicleSuccess({}));

    yield call(enqueueSnackbar, 'Vehicle created', { variant: 'success' });

    const navigate = (yield call(getNavigate)) as (path: string) => void;
    yield call(navigate, '/vehicles');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create vehicle';
    yield put(createVehicleFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
