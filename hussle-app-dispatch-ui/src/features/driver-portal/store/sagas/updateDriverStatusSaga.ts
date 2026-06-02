import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { advanceStatus, checkIn } from 'utils/api/driver-portal/driverPortalApi';
import { captureLocation } from '../../captureLocation';
import {
  updateDriverStatusRequest,
  updateDriverStatusSuccess,
  updateDriverStatusFailure,
  fetchDriverPortalLoadRequest,
} from '../reducers/driverPortalPageSlice';

// Advances the driver's load status: stamps a check-in at the device's current
// location (best-effort — proceeds without coords), advances status, then
// refetches so the slice reflects the new state.
export function* updateDriverStatusSaga(
  action: ReturnType<typeof updateDriverStatusRequest>,
): Generator {
  const { loadId, status } = action.payload;
  try {
    const coords = (yield call(captureLocation)) as Awaited<ReturnType<typeof captureLocation>>;
    if (coords) {
      yield call(checkIn, loadId, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        status,
      });
    }
    yield call(advanceStatus, loadId, status);
    yield put(updateDriverStatusSuccess({ loadId }));
    yield put(fetchDriverPortalLoadRequest({ loadId }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update status';
    yield put(updateDriverStatusFailure({ loadId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
