import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getCarriers } from 'utils/api/fleet/carrierApi';
import {
  fetchCarriersSuccess,
  fetchCarriersFailure,
} from '../reducers/carrierNewPageSlice';
import { carrierActions } from '../reducers/carrierEntitySlice';

interface FetchCarriersPayload {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}

export function* fetchCarriersSaga(action: PayloadAction<FetchCarriersPayload>): Generator {
  try {
    const response = (yield call(
      getCarriers,
      action.payload,
    )) as SagaReturnType<typeof getCarriers>;

    yield put(carrierActions.setAll(response.data));
    yield put(
      fetchCarriersSuccess({
        total: response.meta.total,
        page: response.meta.page,
        limit: response.meta.limit,
      }),
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load carriers';
    yield put(fetchCarriersFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
