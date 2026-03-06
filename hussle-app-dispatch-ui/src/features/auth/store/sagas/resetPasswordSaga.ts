import {call, put, select} from 'redux-saga/effects';
import axiosPrivate from 'utils/axios';
import {getNavigate} from 'utils/getNavigate';
import {
  initiatePasswordResetSuccess,
  initiatePasswordResetFailure,
  confirmPasswordResetSuccess,
  confirmPasswordResetFailure,
} from '../authSlice';

import {currentUserEmailSelector} from '../selectors';

export function* initiatePasswordResetSaga(action) {
  try {
    const {email} = action.payload;
    const navigate = yield call(getNavigate);

    const response = yield call(axiosPrivate.post, '/auth/password/reset', {
      email,
    });

    console.log('initiatePasswordResetSaga Response', response);

    yield put(initiatePasswordResetSuccess({email}));
    yield call(navigate, '/reset-password');
  } catch (error: any) {
    yield put(initiatePasswordResetFailure());
  }
}

export function* confirmPasswordResetSaga(action) {
  try {
    const email = yield select(currentUserEmailSelector);
    const {confirmationCode, newPassword} = action.payload;
    const navigate = yield call(getNavigate);

    console.log('confirmPasswordResetSaga', {
      email,
      confirmationCode,
      newPassword,
    });

    yield call(axiosPrivate.post, '/auth/password/reset/confirm', {
      email,
      confirmationCode,
      newPassword,
    });

    yield put(confirmPasswordResetSuccess());
    yield call(navigate, '/login');
  } catch (error: any) {
    yield put(confirmPasswordResetFailure());
  }
}
