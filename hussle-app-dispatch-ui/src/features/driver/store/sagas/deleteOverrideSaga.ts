import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { deleteOverride } from 'utils/api/fleet/driverAvailabilityApi';
import {
  deleteOverrideRequest,
  deleteOverrideSuccess,
  deleteOverrideFailure,
} from '../reducers/driverPageSlice';

type DeleteOverrideAction = ReturnType<typeof deleteOverrideRequest>;

export function* deleteOverrideSaga(action: DeleteOverrideAction): Generator {
  const { driverId, overrideId } = action.payload;

  try {
    yield call(deleteOverride, driverId, overrideId);
    yield put(deleteOverrideSuccess({ overrideId }));
    yield put(notify({ message: 'Override removed', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete override';
    yield put(deleteOverrideFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
