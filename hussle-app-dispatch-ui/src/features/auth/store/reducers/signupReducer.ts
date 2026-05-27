import {PayloadAction} from '@reduxjs/toolkit';
import {
  setPending,
  setFulfilled,
  setRejected,
} from '../../../../utils/authSliceHelpers';
import {SignupParams} from '../authSlice';

export const signupReducer = {
  signupRequest: (state: any, action: PayloadAction<SignupParams>) => {
    setPending(state, {key: 'signup'});
  },

  signupSuccess: (
    state: any,
    action: PayloadAction<{user: any; tenant: any}>,
  ) => {
    setFulfilled(state, {loadingKey: 'signup', errorKey: 'signup'});
  },

  signupFailure: (state: any) => {
    setRejected(state, {
      loadingKey: 'signup',
      errorKey: 'signup',
      failureMessage: 'Signup failed',
    });
  },
};
