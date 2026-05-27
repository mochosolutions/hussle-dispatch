import type { PayloadAction } from '@reduxjs/toolkit';
import {
  setPending,
  setFulfilled,
  setRejected,
} from 'utils/authSliceHelpers';
import type { AuthState, Tenant, UserProfile } from '../authSlice';
import { defaultUserProfileState } from '../authSlice';

export const loginReducer = {
  loginRequest: (
    state: AuthState,
    _action: PayloadAction<{
      data: {email: string; password: string; rememberMe?: boolean};
      returnTo: string | null;
    }>,
  ) => {
    setPending(state, {key: 'login'});
  },
  loginSuccess: (state: AuthState, action: PayloadAction<{user: UserProfile; rememberMe: boolean; orgs: Tenant[]}>) => {
    const {user, rememberMe, orgs} = action.payload;
    state.isLoggedIn = true;
    state.user = user;
    state.orgs = orgs;
    setFulfilled(state, {loadingKey: 'login', errorKey: 'login'});
    state.rememberMe = rememberMe;
    state.initAttempted = true;
    state.portalSessionExpired = false;
  },
  loginFailure: (state: AuthState, action: PayloadAction<{ error: string }>) => {
    setRejected(state, {
      loadingKey: 'login',
      errorKey: 'login',
      failureMessage: action.payload.error,
    });
    state.isLoggedIn = false;
    state.user = defaultUserProfileState;
  },
};
