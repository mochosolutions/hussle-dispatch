import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getDrivers } from 'utils/api/fleet/driverApi';
import {
  fetchDriversRequest,
  fetchDriversSuccess,
  fetchDriversFailure,
} from '../reducers/driverPageSlice';
import { driverActions } from '../reducers/driverEntitySlice';

type FetchDriversAction = ReturnType<typeof fetchDriversRequest>;

export function* fetchDriversSaga(action: FetchDriversAction): Generator {
  try {
    const response = (yield call(
      getDrivers,
      action.payload,
    )) as SagaReturnType<typeof getDrivers>;

    yield put(driverActions.setAll(response.data));
    yield put(
      fetchDriversSuccess({
        total: response.meta.total,
        page: response.meta.page,
        limit: response.meta.limit,
      }),
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load drivers';
    yield put(fetchDriversFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
