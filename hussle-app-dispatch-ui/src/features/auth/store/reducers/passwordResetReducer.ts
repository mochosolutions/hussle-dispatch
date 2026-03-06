import {PayloadAction} from '@reduxjs/toolkit';
import {
  setPending,
  setFulfilled,
  setRejected,
} from '../../../../utils/authSliceHelpers';
import {defaultUserProfileState} from '../authSlice';

export const passwordResetReducer = {
  initiatePasswordResetRequest: (
    state,
    action: PayloadAction<{email: string}>,
  ) => {
    setPending(state, {key: 'initPasswordReset'});
  },
  initiatePasswordResetSuccess: (
    state,
    action: PayloadAction<{email: string}>,
  ) => {
    setFulfilled(state, {
      loadingKey: 'initPasswordReset',
      errorKey: 'initPasswordReset',
    });
    state.user = {...defaultUserProfileState, email: action.payload.email};
  },
  initiatePasswordResetFailure: (state) => {
    setRejected(state, {
      loadingKey: 'initPasswordReset',
      errorKey: 'initPasswordReset',
      failureMessage: 'Init Password Reset',
    });
  },
  confirmPasswordResetRequest: (
    state,
    action: PayloadAction<{confirmationCode: string; newPassword: string}>,
  ) => {
    setPending(state, {key: 'confirmPasswordReset'});
  },
  confirmPasswordResetSuccess: (state) => {
    setFulfilled(state, {
      loadingKey: 'confirmPasswordReset',
      errorKey: 'confirmPasswordReset',
    });
  },
  confirmPasswordResetFailure: (state) => {
    setRejected(state, {
      loadingKey: 'confirmPasswordReset',
      errorKey: 'confirmPasswordReset',
      failureMessage: 'Password Reset Password',
    });
  },
};
