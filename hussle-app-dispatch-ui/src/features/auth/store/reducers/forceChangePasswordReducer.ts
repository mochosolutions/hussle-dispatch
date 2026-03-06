import type { PayloadAction } from '@reduxjs/toolkit';
import {
  setPending,
  setFulfilled,
  setRejected,
} from '../../../../utils/authSliceHelpers';
import type { AuthState, UserProfile } from '../authSlice';

export const forceChangePasswordReducer = {
  forceChangePasswordSessionInit: (
    state: AuthState,
    action: PayloadAction<{
      user: UserProfile;
      session: string;
      rememberMe: boolean;
    }>,
  ) => {
    setPending(state, {key: 'forceChangePassword'});
    state.user = action.payload.user;
    state.session = action.payload.session;
    state.rememberMe = action.payload.rememberMe;
    state.forceChangePassword = true;
  },
  forceChangePasswordRequest: (
    state: AuthState,
    _action: PayloadAction<{password: string}>,
  ) => {
    setPending(state, {key: 'forceChangePassword'});
  },
  forceChangePasswordSuccess: (state: AuthState, action: PayloadAction<{session: string}>) => {
    const {session} = action.payload;
    state.isLoggedIn = true;
    setFulfilled(state, {
      loadingKey: 'forceChangePassword',
      errorKey: 'forceChangePassword',
    });
    state.session = session;
    state.forceChangePassword = false;
  },
  forceChangePasswordFailure: (state: AuthState) => {
    setRejected(state, {
      loadingKey: 'forceChangePassword',
      errorKey: 'forceChangePassword',
      failureMessage: 'Force change password failed',
    });
  },
};
