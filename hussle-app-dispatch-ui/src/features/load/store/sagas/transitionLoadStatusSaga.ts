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

    // Success — update entity in store. Upsert the full detail so route.stops
    // and other detail fields stay intact for any subscribers (e.g. detail page selectors).
    const updatedLoad = response.load;
    if (updatedLoad) {
      yield put(loadActions.upsertOne(updatedLoad));
    }

    yield put(transitionLoadStatusSuccess({ loadId, newStatus: input.status }));

    const isBolMissingAfterDelivery =
      input.status === 'DELIVERED' && updatedLoad?.tracking?.bolSignedAt == null;
    const successMessage = isBolMissingAfterDelivery
      ? 'Delivered. Invoice will be created once the signed BOL is uploaded.'
      : 'Status updated';
    yield call(enqueueSnackbar, successMessage, { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to transition status';
    yield put(transitionLoadStatusFailure({ loadId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
