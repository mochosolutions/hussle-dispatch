import {PayloadAction} from '@reduxjs/toolkit';
import {
  setPending,
  setFulfilled,
  setRejected,
} from 'utils/authSliceHelpers';
import {defaultUserProfileState} from '../authSlice';

export const loginReducer = {
  // Login actions using handlers
  loginRequest: (
    state,
    action: PayloadAction<{
      data: {email: string; password: string; rememberMe?: boolean};
      navigate: any;
      returnTo: string | null;
    }>,
  ) => {
    setPending(state, {key: 'login'});
  },
  loginSuccess: (state, action: PayloadAction<any>) => {
    const {user, rememberMe, orgs} = action.payload;
    state.isLoggedIn = true;
    state.user = user;
    state.orgs = orgs; // Ensure orgs is always an array
    // Using handler to update loading & error state
    setFulfilled(state, {loadingKey: 'login', errorKey: 'login'});
    state.rememberMe = rememberMe; // Save persistence choice
    state.initAttempted = true;
  },
  loginFailure: (state) => {
    // Use failure handler for login failure
    setRejected(state, {
      loadingKey: 'login',
      errorKey: 'login',
      failureMessage: 'Login failed',
    });
    state.isLoggedIn = false;
    state.user = defaultUserProfileState;
  },
};
