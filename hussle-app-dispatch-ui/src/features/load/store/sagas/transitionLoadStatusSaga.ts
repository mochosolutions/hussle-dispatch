import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { transitionStatus } from 'utils/api/loads/loadApi';
import {
  transitionLoadStatusRequest,
  transitionLoadStatusSuccess,
  transitionLoadStatusFailure,
  showTransitionWarnings,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';
import { mapDetailToListItem } from './detailToListItemMapper';

export function* transitionLoadStatusSaga(
  action: ReturnType<typeof transitionLoadStatusRequest>,
): Generator {
  const { loadId, input } = action.payload;

  try {
    const response = (yield call(
      transitionStatus,
      loadId,
      input,
    )) as SagaReturnType<typeof transitionStatus>;

    // Handle warnings — dispatch for UI to display confirmation dialog
    if (!response.success && response.warnings && response.warnings.length > 0) {
      yield put(showTransitionWarnings({ loadId, warnings: response.warnings }));
      return;
    }

    // Handle hard error from API
    if (!response.success && response.error) {
      const errorMessage = response.error.message;
      yield put(transitionLoadStatusFailure({ loadId, error: errorMessage }));
      yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
      return;
    }

    // Success — update entity in store
    if (response.load) {
      const { load } = response;
      yield put(loadActions.updateOne({ id: loadId, changes: mapDetailToListItem(load) }));
      yield put(loadActions.upsertOne(load));
    }

    yield put(transitionLoadStatusSuccess({ loadId, newStatus: input.status }));
    yield call(enqueueSnackbar, 'Status updated', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to transition status';
    yield put(transitionLoadStatusFailure({ loadId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
