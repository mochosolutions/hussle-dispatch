import {call, put, select} from 'redux-saga/effects';
import {
  initSuccess,
  initFailure,
} from '../authSlice';
import {initAttemptedSelector} from '../selectors/initSelector';
import {selectIsLoggedIn} from '../selectors';
import axiosPrivate from 'utils/axios';

function isValidAuthResponse(data: unknown): data is { user: { id: string }; accessibleOrgs?: unknown[] } {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.user !== 'object' || obj.user === null) return false;
  const user = obj.user as Record<string, unknown>;
  return typeof user.id === 'string';
}

export function* initializeAuthSaga() {
  console.log('[initSaga] v1.0.1 - Response validation enabled');
  try {
    const initAttempted = yield select(initAttemptedSelector);
    const isLoggedIn = yield select(selectIsLoggedIn);

    if (initAttempted || isLoggedIn) {
      console.log('Initialization already attempted, skipping...');
      return;
    }

    // Verify auth via cookies - call /auth/me
    // Cookies are sent automatically via withCredentials: true
    const userResponse = yield call(axiosPrivate.get, '/auth/me');

    // Validate response structure (guards against HTML fallback from misconfigured API URL)
    if (!isValidAuthResponse(userResponse.data)) {
      console.error('Invalid auth response - expected JSON with user object, got:', typeof userResponse.data);
      yield put(initFailure());
      return;
    }

    console.log("User response from /auth/me", userResponse.data);
    const user = userResponse.data.user;
    const orgs = userResponse.data.accessibleOrgs || [];

    console.log('User Orgs data', orgs);

    yield put(initSuccess({user, orgs}));
  } catch (error) {
    console.error('Error reauthenticating user:', error);
    // Clear rememberMe flag if present (but no tokens stored)
    localStorage.removeItem('rememberMe');
    yield put(initFailure());
  }
}
