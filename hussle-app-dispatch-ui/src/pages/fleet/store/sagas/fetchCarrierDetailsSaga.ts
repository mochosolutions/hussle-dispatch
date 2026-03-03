import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getCarrier } from 'utils/api/fleet/carrierApi';
import {
  fetchCarrierDetailsRequest,
  fetchCarrierDetailsSuccess,
  fetchCarrierDetailsFailure,
} from '../reducers/carrierPageSlice';
import { carrierActions } from '../reducers/carrierEntitySlice';

export function* fetchCarrierDetailsSaga(
  action: ReturnType<typeof fetchCarrierDetailsRequest>,
): Generator {
  try {
    const { id } = action.payload;

    const response = (yield call(getCarrier, id)) as SagaReturnType<typeof getCarrier>;

    yield put(carrierActions.addOne(response.carrier));
    yield put(fetchCarrierDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load carrier details';
    yield put(fetchCarrierDetailsFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
