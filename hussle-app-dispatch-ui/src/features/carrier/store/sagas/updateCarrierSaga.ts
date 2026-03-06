import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { updateCarrier } from 'utils/api/fleet/carrierApi';
import {
  updateCarrierRequest,
  updateCarrierSuccess,
  updateCarrierFailure,
} from '../reducers/carrierPageSlice';
import { carrierActions } from '../reducers/carrierEntitySlice';

export function* updateCarrierSaga(action: ReturnType<typeof updateCarrierRequest>): Generator {
  try {
    const { id, data } = action.payload;

    const response = (yield call(updateCarrier, id, data)) as SagaReturnType<typeof updateCarrier>;

    yield put(carrierActions.updateOne({ id, changes: response.carrier }));
    yield put(updateCarrierSuccess({ id }));

    yield call(enqueueSnackbar, 'Carrier updated', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update carrier';
    yield put(updateCarrierFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
