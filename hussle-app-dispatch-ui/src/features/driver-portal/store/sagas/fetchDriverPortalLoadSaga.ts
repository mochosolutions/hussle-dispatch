import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { getLoadSummary } from 'utils/api/driver-portal/driverPortalApi';
import { driverPortalActions } from '../reducers/driverPortalEntitySlice';
import {
  fetchDriverPortalLoadRequest,
  fetchDriverPortalLoadSuccess,
  fetchDriverPortalLoadFailure,
} from '../reducers/driverPortalPageSlice';

interface AxiosLikeError {
  response?: { status: number };
}

const isAxiosError = (err: unknown): err is AxiosLikeError =>
  typeof err === 'object' && err !== null && 'response' in err;

export function* fetchDriverPortalLoadSaga(
  action: ReturnType<typeof fetchDriverPortalLoadRequest>,
): Generator {
  const { loadId } = action.payload;
  try {
    const load = (yield call(getLoadSummary, loadId)) as SagaReturnType<typeof getLoadSummary>;
    yield put(driverPortalActions.upsertOne(load));
    // Terminal loads still render (read-only); the page derives that from the
    // entity status, so success is enough here.
    yield put(fetchDriverPortalLoadSuccess({ loadId }));
  } catch (err: unknown) {
    // A 401 means there is no valid driver session — show the "invalid link"
    // screen, which renders a Sign In button that routes to the universal login
    // (with a returnTo back to this load). A 403 (authenticated but not the
    // assigned driver) or any other failure shows the generic error screen.
    const portalStatus = isAxiosError(err) && err.response?.status === 401 ? 'invalid' : 'error';
    yield put(fetchDriverPortalLoadFailure({ loadId, portalStatus }));
  }
}
