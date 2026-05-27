import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getDriver } from 'utils/api/fleet/driverApi';
import {
  fetchDriverDetailsRequest,
  fetchDriverDetailsSuccess,
  fetchDriverDetailsFailure,
} from '../reducers/driverPageSlice';
import { driverActions } from '../reducers/driverEntitySlice';

type FetchDriverDetailsAction = ReturnType<typeof fetchDriverDetailsRequest>;

export function* fetchDriverDetailsSaga(action: FetchDriverDetailsAction): Generator {
  const { id } = action.payload;

  try {
    const response = (yield call(getDriver, id)) as SagaReturnType<typeof getDriver>;

    yield put(driverActions.upsertOne(response));
    yield put(fetchDriverDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load driver details';
    yield put(fetchDriverDetailsFailure({ id, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
