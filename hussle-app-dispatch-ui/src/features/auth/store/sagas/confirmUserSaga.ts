import {call, put, select} from 'redux-saga/effects';
import {
  codeConfirmationSuccess,
  codeConfirmationFailure,
  resendCodeFailure,
  resendCodeSuccess,
} from '../authSlice';
import {currentUserSelector} from '../selectors';
import axiosPrivate from 'utils/axios';
import {getNavigate} from 'utils/getNavigate';

export function* handleConfirmCode(action) {
  let navigate;
  try {
    const {confirmationCode} = action.payload;
    navigate = yield call(getNavigate);
    const user = yield select(currentUserSelector);
    const userEmail = user?.email || '';
    yield call(axiosPrivate.post, '/auth/signup/confirm', {
      confirmationCode,
      email: userEmail,
    });
    yield put(codeConfirmationSuccess({email: userEmail}));
    yield call(navigate, '/login');
  } catch (error) {
    console.error('Error registering user', error);
    yield put(codeConfirmationFailure());
  }
}

export function* handleResendCode() {
  try {
    const user = yield select(currentUserSelector);
    const userEmail = user?.email || '';
    console.log('Resending code to', userEmail);

    const response = yield call(axiosPrivate.post, '/auth/signup/resend-code', {
      email: userEmail,
    });
    console.log('Resend code response', response);

    yield put(resendCodeSuccess());
  } catch (error) {
    console.error('Error resending code', error);
    yield put(resendCodeFailure());
  }
}
