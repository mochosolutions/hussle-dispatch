import { call, put } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { deleteAccessorial } from 'utils/api/loads/accessorialApi';
import {
  deleteAccessorialRequest,
  deleteAccessorialSuccess,
  deleteAccessorialFailure,
  fetchLoadDetailsRequest,
} from '../reducers/loadPageSlice';

export function* deleteAccessorialSaga(
  action: ReturnType<typeof deleteAccessorialRequest>,
): Generator {
  const { loadId, accessorialId } = action.payload;

  try {
    yield call(deleteAccessorial, accessorialId);
    yield put(deleteAccessorialSuccess({ loadId }));
    yield put(fetchLoadDetailsRequest({ id: loadId }));
    yield call(enqueueSnackbar, 'Accessorial charge removed', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to remove accessorial charge';
    yield put(deleteAccessorialFailure({ loadId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
