import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { isAxiosError } from 'axios';
import { deleteLoad } from 'utils/api/loads/loadApi';
import { getNavigate } from 'utils/getNavigate';
import {
  deleteLoadRequest,
  deleteLoadSuccess,
  deleteLoadFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

export function* deleteLoadSaga(action: ReturnType<typeof deleteLoadRequest>): Generator {
  const { id } = action.payload;

  try {
    yield call(deleteLoad, id);

    yield put(loadActions.removeOne(id));
    yield put(deleteLoadSuccess({ id }));

    yield put(notify({ message: 'Load deleted', variant: 'success' }));

    const navigate = (yield call(getNavigate)) as (path: string) => void;
    yield call(navigate, '/loads');
  } catch (error: unknown) {
    let errorMessage: string;

    if (isAxiosError(error) && error.response?.status === 409) {
      errorMessage = 'Cannot delete: load has associated invoices or documents';
    } else {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete load';
    }

    yield put(notify({ message: errorMessage, variant: 'error' }));
    yield put(deleteLoadFailure({ error: errorMessage, id }));
  }
}
