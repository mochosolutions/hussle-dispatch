import {takeLatest} from 'redux-saga/effects';

import {
  authReducer,
  codeConfirmationRequest,
  signupRequest,
  logoutRequest,
  initRequest,
  forceChangePasswordRequest,
  loginRequest,
  resendCodeRequest,
  initiatePasswordResetRequest,
  confirmPasswordResetRequest,
  switchOrgRequest
} from './authSlice';

import {
  handleLogin,
  initializeAuthSaga,
  handleLogout,
  handleForceChangePassword,
  handleRegister,
  handleConfirmCode,
  handleResendCode,
  initiatePasswordResetSaga,
  confirmPasswordResetSaga,
  switchOrgSaga
} from './sagas';

export function* authWatcher() {
  yield takeLatest(signupRequest.type, handleRegister);
  yield takeLatest(codeConfirmationRequest.type, handleConfirmCode);
  yield takeLatest(loginRequest.type, handleLogin);
  yield takeLatest(initRequest.type, initializeAuthSaga);
  yield takeLatest(logoutRequest.type, handleLogout);
  yield takeLatest(forceChangePasswordRequest.type, handleForceChangePassword);
  yield takeLatest(resendCodeRequest.type, handleResendCode);
  yield takeLatest(initiatePasswordResetRequest.type, initiatePasswordResetSaga,);
  yield takeLatest(confirmPasswordResetRequest.type, confirmPasswordResetSaga);
  yield takeLatest(switchOrgRequest.type, switchOrgSaga);
}

export {authReducer};
