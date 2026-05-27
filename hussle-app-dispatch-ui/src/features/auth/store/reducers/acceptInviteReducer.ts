import type { PayloadAction } from '@reduxjs/toolkit';
import {
  setPending,
  setFulfilled,
  setRejected,
} from 'utils/authSliceHelpers';
import type { AuthState, Tenant, UserProfile } from '../authSlice';

export const acceptInviteReducer = {
  acceptInviteRequest: (
    state: AuthState,
    _action: PayloadAction<{ invitationToken: string; password: string }>,
  ) => {
    setPending(state, { key: 'login' });
  },
  acceptInviteSuccess: (
    state: AuthState,
    action: PayloadAction<{ user: UserProfile; orgs: Tenant[] }>,
  ) => {
    const { user, orgs } = action.payload;
    state.isLoggedIn = true;
    state.user = user;
    state.orgs = orgs;
    state.rememberMe = false;
    state.initAttempted = true;
    setFulfilled(state, { loadingKey: 'login', errorKey: 'login' });
  },
  acceptInviteFailure: (state: AuthState, action: PayloadAction<{ error: string }>) => {
    setRejected(state, {
      loadingKey: 'login',
      errorKey: 'login',
      failureMessage: action.payload.error,
    });
  },
};
