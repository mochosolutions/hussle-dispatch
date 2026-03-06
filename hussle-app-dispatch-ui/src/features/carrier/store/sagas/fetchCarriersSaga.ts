import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getCarriers } from 'utils/api/fleet/carrierApi';
import {
  fetchCarriersRequest,
  fetchCarriersSuccess,
  fetchCarriersFailure,
} from '../reducers/carrierPageSlice';
import { carrierActions } from '../reducers/carrierEntitySlice';

export function* fetchCarriersSaga(
  action: ReturnType<typeof fetchCarriersRequest>,
): Generator {
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
