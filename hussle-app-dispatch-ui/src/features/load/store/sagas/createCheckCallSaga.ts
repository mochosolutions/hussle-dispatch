import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { createCheckCall } from 'utils/api/loads/loadApi';
import {
  createCheckCallRequest,
  createCheckCallSuccess,
  createCheckCallFailure,
  fetchLoadDetailsRequest,
} from '../reducers/loadPageSlice';

export function* createCheckCallSaga(
  action: ReturnType<typeof createCheckCallRequest>,
): Generator {
  const { loadId, data } = action.payload;

  try {
    (yield call(createCheckCall, loadId, data)) as SagaReturnType<typeof createCheckCall>;

    yield put(createCheckCallSuccess({ loadId }));
    yield put(fetchLoadDetailsRequest({ id: loadId }));
    yield call(enqueueSnackbar, 'Check call created', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create check call';
    yield put(createCheckCallFailure({ loadId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
