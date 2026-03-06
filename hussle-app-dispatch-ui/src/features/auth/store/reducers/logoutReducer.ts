import {
  setPending,
  setFulfilled,
  setRejected,
} from '../../../../utils/authSliceHelpers';
import type { AuthState } from '../authSlice';
import { defaultUserProfileState } from '../authSlice';

export const logoutReducer = {
  logoutRequest: (state: AuthState) => {
    setPending(state, {key: 'logout'});
  },
  logoutSuccess: (state: AuthState) => {
    setFulfilled(state, {loadingKey: 'logout', errorKey: 'logout'});
    state.isLoggedIn = false;
    state.user = defaultUserProfileState;
    state.rememberMe = false;
  },
  logoutFailure: (state: AuthState) => {
    setRejected(state, {
      loadingKey: 'logout',
      errorKey: 'logout',
      failureMessage: 'Logout failed',
    });
  },
};
