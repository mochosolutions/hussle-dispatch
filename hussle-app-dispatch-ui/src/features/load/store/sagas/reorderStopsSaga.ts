import { call, put } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { reorderStops } from 'utils/api/loads/stopApi';
import {
  reorderStopsRequest,
  reorderStopsSuccess,
  reorderStopsFailure,
  fetchLoadDetailsRequest,
} from '../reducers/loadPageSlice';

export function* reorderStopsSaga(action: ReturnType<typeof reorderStopsRequest>): Generator {
  const { loadId, stopOrder } = action.payload;

  try {
    yield call(reorderStops, loadId, stopOrder);
    yield put(reorderStopsSuccess({ loadId }));
    yield put(fetchLoadDetailsRequest({ id: loadId }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reorder stops';
    yield put(reorderStopsFailure({ loadId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
