import { call, put, spawn } from 'redux-saga/effects';
import { closeSnackbar } from 'notistack';
import { logoutSuccess } from '../authSlice';
import axiosPrivate, { setLoggingOut } from 'utils/axios';
import { getNavigate } from 'utils/getNavigate';

/**
 * Fire-and-forget API call to invalidate the server session.
 * Errors are swallowed — local state is already cleared.
 */
function* callLogoutEndpoint() {
  try {
    yield call(axiosPrivate.post, '/auth/logout');
  } catch {
    // Server-side cleanup failure is non-critical — local state already cleared
  } finally {
    setLoggingOut(false);
  }
}

export function* handleLogout() {
  // Set flag BEFORE any async work so the axios interceptor skips refresh/redirect
  setLoggingOut(true);

  // Clear local state immediately — root reducer resets entire store on logoutSuccess
  localStorage.removeItem('rememberMe');
  yield put(logoutSuccess());
  yield call(closeSnackbar); // dismiss active toasts (notistack is not Redux)

  // Navigate to login
  try {
    const navigate = yield call(getNavigate);
    yield call(navigate, '/login');
  } catch {
    // Navigation not available — state reset is sufficient
  }

  // Fire-and-forget: notify the server to invalidate the session cookie
  yield spawn(callLogoutEndpoint);
}
