import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { createAccessorial } from 'utils/api/loads/accessorialApi';
import {
  createAccessorialRequest,
  createAccessorialSuccess,
  createAccessorialFailure,
  fetchLoadDetailsRequest,
} from '../reducers/loadPageSlice';

export function* createAccessorialSaga(
  action: ReturnType<typeof createAccessorialRequest>,
): Generator {
  const { loadId, data } = action.payload;

  try {
    yield call(createAccessorial, loadId, data);
    yield put(createAccessorialSuccess({ loadId }));
    yield put(fetchLoadDetailsRequest({ id: loadId }));
    yield put(notify({ message: 'Accessorial charge added', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add accessorial charge';
    yield put(createAccessorialFailure({ loadId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
