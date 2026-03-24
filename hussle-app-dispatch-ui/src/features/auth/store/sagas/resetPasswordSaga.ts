import {call, put, select} from 'redux-saga/effects';
import axiosPrivate from 'utils/axios';
import {getNavigate} from 'utils/getNavigate';
import {
  initiatePasswordResetRequest,
  initiatePasswordResetSuccess,
  initiatePasswordResetFailure,
  confirmPasswordResetRequest,
  confirmPasswordResetSuccess,
  confirmPasswordResetFailure,
} from '../authSlice';

import {currentUserEmailSelector} from '../selectors';

export function* initiatePasswordResetSaga(
  action: ReturnType<typeof initiatePasswordResetRequest>,
) {
  try {
    const {email} = action.payload;
    const navigate = yield call(getNavigate);

    yield call(axiosPrivate.post, '/auth/password/reset', {
      email,
    });

    yield put(initiatePasswordResetSuccess({email}));
    yield call(navigate, '/reset-password', { state: { email } });
  } catch (error: unknown) {
    yield put(initiatePasswordResetFailure());
  }
}

export function* confirmPasswordResetSaga(
  action: ReturnType<typeof confirmPasswordResetRequest>,
) {
  try {
    const email = yield select(currentUserEmailSelector);
    const {confirmationCode, newPassword} = action.payload;
    const navigate = yield call(getNavigate);

    yield call(axiosPrivate.post, '/auth/password/reset/confirm', {
      email,
      confirmationCode,
      newPassword,
    });

    yield put(confirmPasswordResetSuccess());
    yield call(navigate, '/login');
  } catch (error: unknown) {
    yield put(confirmPasswordResetFailure());
  }
}
