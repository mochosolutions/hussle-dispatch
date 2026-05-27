import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { isAxiosError } from 'axios';
import { assignLoad } from 'utils/api/loads/loadApi';
import {
  assignLoadRequest,
  assignLoadSuccess,
  assignLoadFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

export function* assignLoadSaga(action: ReturnType<typeof assignLoadRequest>): Generator {
  const { loadId, data } = action.payload;

  try {
    const response = (yield call(assignLoad, loadId, data)) as SagaReturnType<typeof assignLoad>;

    for (const warning of response.warnings) {
      yield put(notify({ message: warning.message, variant: 'warning' }));
    }

    const { load } = response;

    yield put(loadActions.upsertOne(load));
    yield put(assignLoadSuccess({ loadId }));
    yield put(notify({ message: 'Assignment updated', variant: 'success' }));
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 422) {
      const blockers = error.response.data?.blockers;
      if (Array.isArray(blockers) && blockers.length > 0) {
        const blockerMessages = blockers
          .map((b: { message: string }) => b.message)
          .join('\n');
        yield put(assignLoadFailure({ loadId, error: blockerMessages }));
        yield put(notify({ message: blockerMessages, variant: 'error' }));
        return;
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to update assignment';
    yield put(assignLoadFailure({ loadId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
