import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
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
    yield put(notify({ message: 'Stop removed', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove stop';
    yield put(deleteStopFailure({ loadId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
