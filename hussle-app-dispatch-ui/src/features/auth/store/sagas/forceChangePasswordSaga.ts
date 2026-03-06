import {call, put, select} from 'redux-saga/effects';
import {
  loginSuccess,
  forceChangePasswordSuccess,
  forceChangePasswordFailure,
} from '../authSlice';
import {
  userSessionSelector,
  currentUserSelector,
  rememberMeSelector,
} from '../selectors';
import axiosPrivate from 'utils/axios';
import {getNavigate} from 'utils/getNavigate';

export function* handleForceChangePassword(action) {
  try {
    const {password} = action.payload;
    const session = yield select(userSessionSelector);
    const user = yield select(currentUserSelector);
    const rememberMe = yield select(rememberMeSelector);

    console.log('user', user);
    const userEmail = user?.email || '';

    if (!session) throw new Error('No session found for password change.');
    if (!userEmail) throw new Error('No user email found for password change.');

    const response = yield call(
      axiosPrivate.post,
      '/auth/signup/challenge',
      {
        session,
        password,
        email: userEmail,
      },
    );

    console.log('Password change response', response);

    if (rememberMe) {
      localStorage.setItem('rememberMe', JSON.stringify(true));
    } else {
      localStorage.removeItem('rememberMe');
    }

    const userSession = response?.data?.session;
    const orgs = response?.data?.accessibleOrgs || [];

    console.log('handleForceChangePassword - password changed successfully');
    yield put(
      loginSuccess({
        user,
        orgs,
        rememberMe,
      }),
    );

    const navigate = yield call(getNavigate);
    console.log('Calling navigate');
    yield call(navigate, '/');
    // yield delay(3000);
    yield put(forceChangePasswordSuccess({session: userSession}));
  } catch (error) {
    console.error('Error changing password', error);
    yield put(forceChangePasswordFailure());
  }
}
