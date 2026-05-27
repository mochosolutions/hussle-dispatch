import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getLoad } from 'utils/api/loads/loadApi';
import {
  fetchLoadDetailsRequest,
  fetchLoadDetailsSuccess,
  fetchLoadDetailsFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

export function* fetchLoadDetailSaga(
  action: ReturnType<typeof fetchLoadDetailsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const load = (yield call(getLoad, id)) as SagaReturnType<typeof getLoad>;

    yield put(loadActions.upsertOne(load));
    yield put(fetchLoadDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load load details';
    yield put(fetchLoadDetailsFailure({ id, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
