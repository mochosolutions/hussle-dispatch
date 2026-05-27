import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getNavigate } from 'utils/getNavigate';
import { createDriver } from 'utils/api/fleet/driverApi';
import {
  createDriverRequest,
  createDriverSuccess,
  createDriverFailure,
} from '../reducers/driverPageSlice';
import { driverActions } from '../reducers/driverEntitySlice';

type CreateDriverAction = ReturnType<typeof createDriverRequest>;

export function* createDriverSaga(action: CreateDriverAction): Generator {
  try {
    const { data } = action.payload;

    const response = (yield call(
      createDriver,
      data,
    )) as SagaReturnType<typeof createDriver>;

    yield put(driverActions.addOne(response));
    yield put(createDriverSuccess());

    yield put(notify({ message: 'Driver created', variant: 'success' }));

    const { redirectTo, onCreated } = action.payload;
    if (onCreated) {
      onCreated(response.id);
    }
    if (redirectTo) {
      const navigate = (yield call(getNavigate)) as (path: string) => void;
      yield call(navigate, redirectTo);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create driver';
    yield put(createDriverFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
