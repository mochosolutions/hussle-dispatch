import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { isAxiosError } from 'axios';
import { assignLoad, transitionStatus } from 'utils/api/loads/loadApi';
import {
  assignAndDispatchRequest,
  assignAndDispatchSuccess,
  assignAndDispatchFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';
import { mapDetailToListItem } from './detailToListItemMapper';

export function* assignAndDispatchSaga(
  action: ReturnType<typeof assignAndDispatchRequest>,
): Generator {
  const { loadId, assignment, notes } = action.payload;

  try {
    // Step 1: Assign driver/vehicle/carrier
    const assignResponse = (yield call(
      assignLoad,
      loadId,
      assignment,
    )) as SagaReturnType<typeof assignLoad>;

    if (assignResponse.warnings.length > 0) {
      assignResponse.warnings.forEach((warning) => {
        enqueueSnackbar(warning.message, { variant: 'warning' });
      });
    }

    // Update entity store after assignment
    const assignedLoad = assignResponse.load;
    yield put(
      loadActions.updateOne({ id: loadId, changes: mapDetailToListItem(assignedLoad) }),
    );

    // Step 2: Transition to DISPATCHED
    const transitionResponse = (yield call(transitionStatus, loadId, {
      status: 'DISPATCHED',
      notes: notes || undefined,
    })) as SagaReturnType<typeof transitionStatus>;

    if (!transitionResponse.success && transitionResponse.error) {
      yield put(assignAndDispatchFailure({ loadId, error: transitionResponse.error.message }));
      yield call(enqueueSnackbar, transitionResponse.error.message, { variant: 'error' });
      return;
    }

    // Update entity store after transition
    if (transitionResponse.load) {
      const { load } = transitionResponse;
      yield put(loadActions.updateOne({ id: loadId, changes: mapDetailToListItem(load) }));
      yield put(loadActions.upsertOne(load));
    }

    yield put(assignAndDispatchSuccess({ loadId }));
    yield call(enqueueSnackbar, 'Load assigned and dispatched', { variant: 'success' });
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.data) {
      const { data } = error.response;

      // 422 blocker errors from assignment validation
      if (error.response.status === 422 && Array.isArray(data.blockers) && data.blockers.length > 0) {
        const blockerMessages = data.blockers
          .map((b: { message: string }) => b.message)
          .join('\n');
        yield put(assignAndDispatchFailure({ loadId, error: blockerMessages }));
        yield call(enqueueSnackbar, blockerMessages, { variant: 'error' });
        return;
      }

      // Structured API errors (e.g., 400 from transition)
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const apiMessage = data.errors
          .map((e: { message: string }) => e.message)
          .join('\n');
        yield put(assignAndDispatchFailure({ loadId, error: apiMessage }));
        yield call(enqueueSnackbar, apiMessage, { variant: 'error' });
        return;
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to assign and dispatch load';
    yield put(assignAndDispatchFailure({ loadId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
