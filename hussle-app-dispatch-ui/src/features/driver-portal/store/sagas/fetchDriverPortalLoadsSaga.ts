import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { getDriverLoads } from 'utils/api/driver-portal/driverPortalApi';
import { driverPortalActions } from '../reducers/driverPortalEntitySlice';
import {
  fetchDriverPortalLoadsSuccess,
  fetchDriverPortalLoadsFailure,
} from '../reducers/driverPortalPageSlice';

interface AxiosLikeError {
  response?: { status: number };
}

const isAxiosError = (err: unknown): err is AxiosLikeError =>
  typeof err === 'object' && err !== null && 'response' in err;

export function* fetchDriverPortalLoadsSaga(): Generator {
  try {
    const loads = (yield call(getDriverLoads)) as SagaReturnType<typeof getDriverLoads>;
    yield put(driverPortalActions.setAll(loads));
    yield put(fetchDriverPortalLoadsSuccess());
  } catch (err: unknown) {
    // A 401 means there is no valid driver session — show the "Sign In Required"
    // screen with a Sign In button. Any other failure shows the generic error.
    const listStatus = isAxiosError(err) && err.response?.status === 401 ? 'invalid' : 'error';
    yield put(fetchDriverPortalLoadsFailure({ listStatus }));
  }
}
