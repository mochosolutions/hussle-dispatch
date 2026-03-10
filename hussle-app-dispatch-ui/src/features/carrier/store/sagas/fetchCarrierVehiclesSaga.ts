import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getCarrierVehicles } from 'utils/api/fleet/carrierApi';
import {
  vehicleActions,
} from '../../../vehicle/store/reducers/vehicleEntitySlice';

export function* fetchCarrierVehiclesSaga(
  action: PayloadAction<{ carrierId: string }>,
): Generator {
  const { carrierId } = action.payload;

  try {
    const response = (yield call(
      getCarrierVehicles,
      carrierId,
    )) as SagaReturnType<typeof getCarrierVehicles>;

    yield put(vehicleActions.setAll(response.data));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load carrier vehicles';
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
