import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState } from '../authSlice';
import {
  setPending,
  setFulfilled,
  setRejected,
} from '../../../../utils/authSliceHelpers';
import { defaultUserProfileState } from '../authSlice';

export const passwordResetReducer = {
  initiatePasswordResetRequest: (
    state: AuthState,
    _action: PayloadAction<{ email: string }>,
  ) => {
    setPending(state, { key: 'initPasswordReset' });
  },
  initiatePasswordResetSuccess: (
    state: AuthState,
    action: PayloadAction<{ email: string }>,
  ) => {
    setFulfilled(state, {
      loadingKey: 'initPasswordReset',
      errorKey: 'initPasswordReset',
    });
    state.user = { ...defaultUserProfileState, email: action.payload.email };
  },
  initiatePasswordResetFailure: (state: AuthState) => {
    setRejected(state, {
      loadingKey: 'initPasswordReset',
      errorKey: 'initPasswordReset',
      failureMessage: 'Init Password Reset',
    });
  },
  confirmPasswordResetRequest: (
    state: AuthState,
    _action: PayloadAction<{ confirmationCode: string; newPassword: string }>,
  ) => {
    setPending(state, { key: 'confirmPasswordReset' });
  },
  confirmPasswordResetSuccess: (state: AuthState) => {
    setFulfilled(state, {
      loadingKey: 'confirmPasswordReset',
      errorKey: 'confirmPasswordReset',
    });
  },
  confirmPasswordResetFailure: (state: AuthState) => {
    setRejected(state, {
      loadingKey: 'confirmPasswordReset',
      errorKey: 'confirmPasswordReset',
      failureMessage: 'Password Reset Password',
    });
  },
};
