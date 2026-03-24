import { call, put } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { deleteStop } from 'utils/api/loads/stopApi';
import {
  deleteStopRequest,
  deleteStopSuccess,
  deleteStopFailure,
  fetchLoadDetailsRequest,
} from '../reducers/loadPageSlice';

export function* deleteStopSaga(action: ReturnType<typeof deleteStopRequest>): Generator {
  const { loadId, stopId } = action.payload;

  try {
    yield call(deleteStop, loadId, stopId);
    yield put(deleteStopSuccess({ loadId }));
    yield put(fetchLoadDetailsRequest({ id: loadId }));
    yield call(enqueueSnackbar, 'Stop removed', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove stop';
    yield put(deleteStopFailure({ loadId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
