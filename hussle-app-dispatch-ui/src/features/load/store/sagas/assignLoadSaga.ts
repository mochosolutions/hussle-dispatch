import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { isAxiosError } from 'axios';
import { assignLoad } from 'utils/api/loads/loadApi';
import {
  assignLoadRequest,
  assignLoadSuccess,
  assignLoadFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';
import { mapDetailToListItem } from './detailToListItemMapper';

export function* assignLoadSaga(action: ReturnType<typeof assignLoadRequest>): Generator {
  const { loadId, data } = action.payload;

  try {
    const response = (yield call(assignLoad, loadId, data)) as SagaReturnType<typeof assignLoad>;

    if (response.warnings.length > 0) {
      response.warnings.forEach((warning) => {
        enqueueSnackbar(warning.message, { variant: 'warning' });
      });
    }

    const { load } = response;

    yield put(loadActions.updateOne({ id: loadId, changes: mapDetailToListItem(load) }));
    yield put(loadActions.upsertOne(load));
    yield put(assignLoadSuccess({ loadId }));
    yield call(enqueueSnackbar, 'Assignment updated', { variant: 'success' });
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 422) {
      const blockers = error.response.data?.blockers;
      if (Array.isArray(blockers) && blockers.length > 0) {
        const blockerMessages = blockers
          .map((b: { message: string }) => b.message)
          .join('\n');
        yield put(assignLoadFailure({ loadId, error: blockerMessages }));
        yield call(enqueueSnackbar, blockerMessages, { variant: 'error' });
        return;
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to update assignment';
    yield put(assignLoadFailure({ loadId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
