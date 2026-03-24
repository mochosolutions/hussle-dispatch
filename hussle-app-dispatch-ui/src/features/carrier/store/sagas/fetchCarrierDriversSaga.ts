import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getCarrierDrivers } from 'utils/api/fleet/carrierApi';
import {
  driverActions,
} from '../../../driver/store/reducers/driverEntitySlice';

export function* fetchCarrierDriversSaga(
  action: PayloadAction<{ carrierId: string }>,
): Generator {
  const { carrierId } = action.payload;

  try {
    const response = (yield call(
      getCarrierDrivers,
      carrierId,
    )) as SagaReturnType<typeof getCarrierDrivers>;

    yield put(driverActions.upsertMany(response));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load carrier drivers';
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
