import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { isAxiosError } from 'axios';
import { assignLoad, transitionStatus } from 'utils/api/loads/loadApi';
import {
  assignAndDispatchRequest,
  assignAndDispatchSuccess,
  assignAndDispatchFailure,
  setOnboardingBlock,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

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

    for (const warning of assignResponse.warnings) {
      yield put(notify({ message: warning.message, variant: 'warning' }));
    }

    // Update entity store after assignment — upsert the full detail so route.stops
    // and other detail fields stay intact for any subscribers (e.g. detail page selectors).
    const assignedLoad = assignResponse.load;
    yield put(loadActions.upsertOne(assignedLoad));

    // Step 2: Transition to DISPATCHED
    const transitionResponse = (yield call(transitionStatus, loadId, {
      status: 'DISPATCHED',
      notes: notes || undefined,
    })) as SagaReturnType<typeof transitionStatus>;

    if (!transitionResponse.success && transitionResponse.error) {
      yield put(assignAndDispatchFailure({ loadId, error: transitionResponse.error.message }));
      yield put(notify({ message: transitionResponse.error.message, variant: 'error' }));
      return;
    }

    // Update entity store after transition — upsert the full detail (preserves route.stops).
    if (transitionResponse.load) {
      yield put(loadActions.upsertOne(transitionResponse.load));
    }

    yield put(assignAndDispatchSuccess({ loadId }));
    yield put(notify({ message: 'Load assigned and dispatched', variant: 'success' }));
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.data) {
      const { data } = error.response;

      // 422 blocker errors from assignment validation
      if (error.response.status === 422 && Array.isArray(data.blockers) && data.blockers.length > 0) {
        // Check for onboarding blocker — store structured data for override UI
        const onboardingBlocker = data.blockers.find(
          (b: { code: string }) => b.code === 'CARRIER_ONBOARDING_INCOMPLETE',
        );
        if (onboardingBlocker?.metadata) {
          const { carrierId, carrierName, missingDocuments } = onboardingBlocker.metadata as {
            carrierId: string;
            carrierName: string;
            missingDocuments: string[];
          };
          yield put(setOnboardingBlock({ loadId, carrierId, carrierName, missingDocuments }));
        }

        const blockerMessages = data.blockers
          .map((b: { message: string }) => b.message)
          .join('\n');
        yield put(assignAndDispatchFailure({ loadId, error: blockerMessages }));
        yield put(notify({ message: blockerMessages, variant: 'error' }));
        return;
      }

      // Structured API errors (e.g., 400 from transition)
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const apiMessage = data.errors
          .map((e: { message: string }) => e.message)
          .join('\n');
        yield put(assignAndDispatchFailure({ loadId, error: apiMessage }));
        yield put(notify({ message: apiMessage, variant: 'error' }));
        return;
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to assign and dispatch load';
    yield put(assignAndDispatchFailure({ loadId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
