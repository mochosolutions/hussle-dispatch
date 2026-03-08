import { call, put } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { isAxiosError } from 'axios';
import { deleteCarrier } from 'utils/api/fleet/carrierApi';
import {
  deleteCarrierRequest,
  deleteCarrierSuccess,
  deleteCarrierFailure,
} from '../reducers/carrierNewPageSlice';
import { carrierActions } from '../reducers/carrierEntitySlice';

export function* deleteCarrierSaga(action: ReturnType<typeof deleteCarrierRequest>): Generator {
  const { id } = action.payload;

  try {
    yield call(deleteCarrier, id);

    yield put(carrierActions.removeOne(id));
    yield put(deleteCarrierSuccess({ id }));

    yield call(enqueueSnackbar, 'Carrier deleted', { variant: 'success' });
  } catch (error: unknown) {
    let errorMessage: string;

    if (isAxiosError(error) && error.response?.status === 409) {
      errorMessage = 'Cannot delete: carrier has active loads';
    } else {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete carrier';
    }

    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
    yield put(deleteCarrierFailure({ error: errorMessage, id }));
  }
}
