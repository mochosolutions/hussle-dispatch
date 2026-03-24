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

    if (rememberMe) {
      localStorage.setItem('rememberMe', JSON.stringify(true));
    } else {
      localStorage.removeItem('rememberMe');
    }

    const userSession = response?.data?.session;
    const orgs = response?.data?.accessibleOrgs || [];

    yield put(
      loginSuccess({
        user,
        orgs,
        rememberMe,
      }),
    );

    const navigate = yield call(getNavigate);
    yield call(navigate, '/');
    // yield delay(3000);
    yield put(forceChangePasswordSuccess({session: userSession}));
  } catch (_error: unknown) {
    yield put(forceChangePasswordFailure());
  }
}
