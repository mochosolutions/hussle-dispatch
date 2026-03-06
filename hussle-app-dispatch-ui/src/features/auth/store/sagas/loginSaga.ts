import {call, put} from 'redux-saga/effects';
import axiosPrivate from 'utils/axios';
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  forceChangePasswordSessionInit,
  codeConfirmationInit,
} from '../authSlice';
import {getNavigate} from 'utils/getNavigate';
import {getValidRedirectUrl, isExternalUrl} from 'utils/redirectUtils';

export function* handleLogin(action: ReturnType<typeof loginRequest>) {
  try {
    const {
      data: {email, password, rememberMe},
      returnTo,
    } = action.payload;
    const navigate = yield call(getNavigate);

    const loginResponse = yield call(axiosPrivate.post, '/auth/login', {
      email,
      password,
    });

    const {user, session, status, accessibleOrgs} = loginResponse?.data || {};

    console.log('Login Response', loginResponse);

    if (status === 'CHALLENGE_REQUIRED') {
      console.log('CHALLENGE_REQUIRED BLCOkxs', navigate);
      yield put(
        forceChangePasswordSessionInit({
          user,
          session,
          rememberMe: rememberMe ?? false,
        }),
      );
      yield call(navigate, '/change-password');

      return;
    } else if (status === 'UNCONFIRMED') {
      console.log('Account not verified - redirecting to verification', navigate);

      // Set user email in state for verification page
      yield put(codeConfirmationInit({email: user.email}));

      // Redirect to verification page where user can enter code or resend
      yield call(navigate, '/code-verification');
      return;
    }

    console.log('Resolved navigate function:', navigate);
    console.log('REMEMBER ME', rememberMe);

    if (rememberMe) {
      localStorage.setItem('rememberMe', JSON.stringify(true));
    } else {
      localStorage.removeItem('rememberMe');
    }

    yield put(
      loginSuccess({
        user,
        orgs: accessibleOrgs || [],
        rememberMe,
      }),
    );

    // Handle post-login redirect
    const redirectUrl = getValidRedirectUrl(returnTo);

    if (isExternalUrl(redirectUrl)) {
      // External redirect (e.g., marketing site)
      window.location.href = redirectUrl;
    } else {
      // Internal admin navigation
      yield call(navigate, redirectUrl);
    }
  } catch (error) {
    console.error('Error logging in user', error);
    yield put(loginFailure());
  }
}
