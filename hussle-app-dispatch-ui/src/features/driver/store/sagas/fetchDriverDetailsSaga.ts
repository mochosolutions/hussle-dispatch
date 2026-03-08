import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getDriver } from 'utils/api/fleet/driverApi';
import {
  fetchDriverDetailsRequest,
  fetchDriverDetailsSuccess,
  fetchDriverDetailsFailure,
} from '../reducers/driverPageSlice';
import { driverActions } from '../reducers/driverEntitySlice';
import { MOCK_DRIVERS } from '../../mockData';

type FetchDriverDetailsAction = ReturnType<typeof fetchDriverDetailsRequest>;

export function* fetchDriverDetailsSaga(action: FetchDriverDetailsAction): Generator {
  const { id } = action.payload;

  try {
    const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
    if (useMock) {
      const driver = MOCK_DRIVERS.find((d) => d.id === id);
      if (driver) {
        yield put(driverActions.upsertOne(driver));
        yield put(fetchDriverDetailsSuccess({ id }));
      }
      return;
    }

    const response = (yield call(getDriver, id)) as SagaReturnType<typeof getDriver>;

    yield put(driverActions.upsertOne(response.driver));
    yield put(fetchDriverDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load driver details';
    yield put(fetchDriverDetailsFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
