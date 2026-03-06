import {PayloadAction} from '@reduxjs/toolkit';
import {
  defaultUserProfileState,
  UserProfile,
} from '../authSlice';

export const initReducer = {
  initRequest: (state) => {
    state.isInitializing = true;
  },
  initSuccess: (
    state,
    action: PayloadAction<{user: UserProfile; orgs}>,
  ) => {
    console.log("initSuccess", state);
    const {user, orgs} = action.payload;
    state.isInitializing = false;
    state.isLoggedIn = true;
    state.user = {...user};
    state.orgs = orgs;
    state.errors.init = '';
    state.initAttempted = true;
  },
  initFailure: (state) => {
    state.isInitializing = false;
    state.isLoggedIn = false;
    state.user = defaultUserProfileState;
    state.initAttempted = true;
  },
};
