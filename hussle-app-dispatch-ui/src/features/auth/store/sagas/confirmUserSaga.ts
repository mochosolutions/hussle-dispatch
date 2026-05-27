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
  } catch (_error: unknown) {
    yield put(codeConfirmationFailure());
  }
}

export function* handleResendCode() {
  try {
    const user = yield select(currentUserSelector);
    const userEmail = user?.email || '';

    yield call(axiosPrivate.post, '/auth/signup/resend-code', {
      email: userEmail,
    });

    yield put(resendCodeSuccess());
  } catch (_error: unknown) {
    yield put(resendCodeFailure());
  }
}
