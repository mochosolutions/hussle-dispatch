import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, Tenant, UserProfile } from '../authSlice';
import {
  defaultUserProfileState,
} from '../authSlice';

export const initReducer = {
  initRequest: (state: AuthState) => {
    state.isInitializing = true;
  },
  initSuccess: (
    state: AuthState,
    action: PayloadAction<{user: UserProfile; orgs: Tenant[]}>,
  ) => {
    const {user, orgs} = action.payload;
    state.isInitializing = false;
    state.isLoggedIn = true;
    state.user = {...user};
    state.orgs = orgs;
    state.errors.init = '';
    state.initAttempted = true;
  },
  initFailure: (state: AuthState) => {
    state.isInitializing = false;
    state.isLoggedIn = false;
    state.user = defaultUserProfileState;
    state.initAttempted = true;
  },
};
