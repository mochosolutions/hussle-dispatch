import {PayloadAction} from '@reduxjs/toolkit';
import {
  setPending,
  setFulfilled,
  setRejected,
} from '../../../../utils/authSliceHelpers';
import {CodeConfirmationParams} from '../authSlice';

export const codeConfirmationReducer = {
  codeConfirmationInit: (state, action: PayloadAction<{email: string}>) => {
    state.user.email = action.payload.email;
  },

  codeConfirmationRequest: (
    state,
    action: PayloadAction<CodeConfirmationParams>,
  ) => {
    setPending(state, {key: 'confirmCode'});
  },

  codeConfirmationSuccess: (state, action: PayloadAction<{email: string}>) => {
    setFulfilled(state, {
      loadingKey: 'confirmCode',
      errorKey: 'confirmCode',
    });
  },

  codeConfirmationFailure: (state) => {
    setRejected(state, {
      loadingKey: 'confirmCode',
      errorKey: 'confirmCode',
      failureMessage: 'Signup failed',
    });
  },
};
