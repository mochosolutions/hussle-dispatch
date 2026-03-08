import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getDrivers } from 'utils/api/fleet/driverApi';
import {
  fetchDriversRequest,
  fetchDriversSuccess,
  fetchDriversFailure,
} from '../reducers/driverPageSlice';
import { driverActions } from '../reducers/driverEntitySlice';
import { MOCK_DRIVERS } from '../../mockData';

type FetchDriversAction = ReturnType<typeof fetchDriversRequest>;

export function* fetchDriversSaga(action: FetchDriversAction): Generator {
  try {
    const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
    if (useMock) {
      yield put(driverActions.setAll(MOCK_DRIVERS));
      yield put(
        fetchDriversSuccess({
          total: MOCK_DRIVERS.length,
          page: 1,
          limit: 25,
        }),
      );
      return;
    }

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
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
