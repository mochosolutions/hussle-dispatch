import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { createStop } from 'utils/api/loads/stopApi';
import {
  createStopRequest,
  createStopSuccess,
  createStopFailure,
  fetchLoadDetailsRequest,
} from '../reducers/loadPageSlice';

export function* createStopSaga(action: ReturnType<typeof createStopRequest>): Generator {
  const { loadId, data } = action.payload;

  try {
    yield call(createStop, loadId, data);
    yield put(createStopSuccess({ loadId }));
    yield put(fetchLoadDetailsRequest({ id: loadId }));
    yield put(notify({ message: 'Stop added', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add stop';
    yield put(createStopFailure({ loadId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
