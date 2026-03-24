import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
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

    yield call(enqueueSnackbar, 'Driver created', { variant: 'success' });

    const navigate = (yield call(getNavigate)) as (path: string) => void;
    yield call(navigate, '/drivers');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create driver';
    yield put(createDriverFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
