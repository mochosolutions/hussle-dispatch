import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { updateDriver } from 'utils/api/fleet/driverApi';
import {
  updateDriverRequest,
  updateDriverSuccess,
  updateDriverFailure,
} from '../reducers/driverPageSlice';
import { driverActions } from '../reducers/driverEntitySlice';

type UpdateDriverAction = ReturnType<typeof updateDriverRequest>;

export function* updateDriverSaga(action: UpdateDriverAction): Generator {
  const { id, data } = action.payload;

  try {
    const response = (yield call(
      updateDriver,
      id,
      data,
    )) as SagaReturnType<typeof updateDriver>;

    yield put(driverActions.updateOne({ id, changes: response }));
    yield put(driverActions.upsertOne(response));
    yield put(updateDriverSuccess({ id }));

    yield put(notify({ message: 'Driver updated', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update driver';
    yield put(updateDriverFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
