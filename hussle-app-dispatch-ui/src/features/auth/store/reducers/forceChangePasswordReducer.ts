import {PayloadAction} from '@reduxjs/toolkit';
import {
  setPending,
  setFulfilled,
  setRejected,
} from '../../../../utils/authSliceHelpers';
import {UserProfile} from '../authSlice';

export const forceChangePasswordReducer = {
  forceChangePasswordSessionInit: (
    state,
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
    state,
    action: PayloadAction<{password: string}>,
  ) => {
    setPending(state, {key: 'forceChangePassword'});
  },
  forceChangePasswordSuccess: (state, action: PayloadAction<any>) => {
    const {session} = action.payload;
    state.isLoggedIn = true;
    setFulfilled(state, {
      loadingKey: 'forceChangePassword',
      errorKey: 'forceChangePassword',
    });
    state.session = session;
    state.forceChangePassword = false;
  },
  forceChangePasswordFailure: (state) => {
    setRejected(state, {
      loadingKey: 'forceChangePassword',
      errorKey: 'forceChangePassword',
      failureMessage: 'Force change password failed',
    });
  },
};
