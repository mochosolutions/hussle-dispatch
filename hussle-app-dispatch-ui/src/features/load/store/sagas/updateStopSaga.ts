import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { updateStop } from 'utils/api/loads/stopApi';
import {
  updateStopRequest,
  updateStopSuccess,
  updateStopFailure,
  fetchLoadDetailsRequest,
} from '../reducers/loadPageSlice';

export function* updateStopSaga(action: ReturnType<typeof updateStopRequest>): Generator {
  const { loadId, stopId, data } = action.payload;

  try {
    yield call(updateStop, loadId, stopId, data);
    yield put(updateStopSuccess({ loadId }));
    yield put(fetchLoadDetailsRequest({ id: loadId }));
    yield put(notify({ message: 'Stop updated', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update stop';
    yield put(updateStopFailure({ loadId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
