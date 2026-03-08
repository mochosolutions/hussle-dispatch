import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { createVehicle } from 'utils/api/fleet/vehicleApi';
import type { CreateVehicleInput, Vehicle } from 'features/carrier/types';
import { MOCK_VEHICLES } from '../../mockData';
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
    const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';

    if (useMock) {
      const mockVehicle: Vehicle = {
        ...MOCK_VEHICLES[0],
        ...data,
        id: crypto.randomUUID(),
        year: data.year ?? MOCK_VEHICLES[0].year,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      yield put(vehicleActions.addOne(mockVehicle));
      yield put(createVehicleSuccess({}));
      yield call(enqueueSnackbar, 'Vehicle created', { variant: 'success' });

      const navigate = (yield call(getNavigate)) as (path: string) => void;
      yield call(navigate, '/vehicles');
      return;
    }

    const response = (yield call(
      createVehicle,
      data,
    )) as SagaReturnType<typeof createVehicle>;

    yield put(vehicleActions.addOne(response.vehicle));
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
