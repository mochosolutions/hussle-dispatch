import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { updateAccessorial } from 'utils/api/loads/accessorialApi';
import {
  updateAccessorialRequest,
  updateAccessorialSuccess,
  updateAccessorialFailure,
  fetchLoadDetailsRequest,
} from '../reducers/loadPageSlice';

export function* updateAccessorialSaga(
  action: ReturnType<typeof updateAccessorialRequest>,
): Generator {
  const { loadId, accessorialId, data } = action.payload;

  try {
    yield call(updateAccessorial, accessorialId, data);
    yield put(updateAccessorialSuccess({ loadId }));
    yield put(fetchLoadDetailsRequest({ id: loadId }));
    yield put(notify({ message: 'Accessorial charge updated', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update accessorial charge';
    yield put(updateAccessorialFailure({ loadId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
