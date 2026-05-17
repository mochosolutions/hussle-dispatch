import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';

import type { RootState } from 'store';
import { getSessionV2 } from 'utils/api/carrierPortal/v2';
import type { PortalSessionResponseV2 } from 'utils/api/carrierPortal/v2';

import { carrierPortalV2Actions } from '../reducers/carrierPortalSlice';
import { extractErrorMessage, toEngineSession } from './sessionAdapters';

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

function* handleLoadSession(): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(carrierPortalV2Actions.loadSessionFailure('No token available'));
      return;
    }
    const response: PortalSessionResponseV2 = yield call(getSessionV2, token);
    yield put(carrierPortalV2Actions.loadSessionSuccess(toEngineSession(response)));
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to load session');
    yield put(carrierPortalV2Actions.loadSessionFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* loadSessionSaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.loadSession.type, handleLoadSession);
}
