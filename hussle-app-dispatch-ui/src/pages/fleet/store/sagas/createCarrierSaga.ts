import { call, put, select, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { createCarrier } from 'utils/api/fleet/carrierApi';
import type { RootState } from 'store';
import {
  createCarrierRequest,
  createCarrierSuccess,
  createCarrierFailure,
  fetchCarriersRequest,
} from '../reducers/carrierPageSlice';
import { carrierActions } from '../reducers/carrierEntitySlice';

export function* createCarrierSaga(action: ReturnType<typeof createCarrierRequest>): Generator {
  try {
    const response = (yield call(
      createCarrier,
      action.payload.data,
    )) as SagaReturnType<typeof createCarrier>;

    yield put(carrierActions.addOne(response.carrier));
    yield put(createCarrierSuccess());

    yield call(enqueueSnackbar, 'Carrier created', { variant: 'success' });

    const state = (yield select()) as RootState;
    const { page, limit, typeFilter } = state.pages.carrierPage;

    yield put(fetchCarriersRequest({ page, limit, type: typeFilter }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create carrier';
    yield put(createCarrierFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
