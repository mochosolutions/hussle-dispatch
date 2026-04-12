import { call, put, select, takeLatest } from 'redux-saga/effects';
import type { RootState } from 'store';
import { getSession } from 'utils/api/fleet/carrierPortalApi';
import type { PortalSessionResponse } from 'features/carrier-portal/types';
import { carrierPortalActions } from '../slices/carrierPortalSlice';

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleFetchSession(): Generator {
  try {
    const token: string = yield select((state: RootState) => state.pages.carrierPortal.token);
    if (!token) {
      yield put(carrierPortalActions.fetchSessionFailure('No token available'));
      return;
    }
    const response: PortalSessionResponse = yield call(getSession, token);
    yield put(
      carrierPortalActions.fetchSessionSuccess({
        session: response.session,
        carrier: response.carrier,
        answers: response.session.answers ?? {},
      }),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load session';
    yield put(carrierPortalActions.fetchSessionFailure(message));
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* fetchSessionSaga(): Generator {
  yield takeLatest(carrierPortalActions.fetchSession.type, handleFetchSession);
}
