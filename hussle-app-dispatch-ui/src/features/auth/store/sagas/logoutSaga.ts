import {call, put, select} from 'redux-saga/effects';
import {logoutSuccess} from '../authSlice';
import axiosPrivate from 'utils/axios';
import {getNavigate} from 'utils/getNavigate';

export function* handleLogout() {
  let navigate;
  try {
    console.log('Logging out saga...');
    navigate = yield call(getNavigate);
    // Call logout endpoint - cookies sent automatically via withCredentials
    yield call(axiosPrivate.post, '/auth/logout');
  } catch (error: any) {
    console.error('Error during logout:', error.message);
  } finally {
    // Clear local storage (rememberMe flag)
    localStorage.removeItem('rememberMe');
    yield call(navigate, '/login');
    yield put(logoutSuccess());
  }
}
