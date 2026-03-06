import {
  setPending,
  setFulfilled,
  setRejected,
} from '../../../../utils/authSliceHelpers';
import { defaultUserProfileState} from '../authSlice';

export const logoutReducer = {
  logoutRequest: (state) => {
    setPending(state, {key: 'logout'});
  },
  logoutSuccess: (state) => {
    setFulfilled(state, {loadingKey: 'logout', errorKey: 'logout'});
    state.isLoggedIn = false;
    state.user = defaultUserProfileState;
    state.rememberMe = false;
  },
  logoutFailure: (state) => {
    setRejected(state, {
      loadingKey: 'logout',
      errorKey: 'logout',
      failureMessage: 'Logout failed',
    });
  },
};
