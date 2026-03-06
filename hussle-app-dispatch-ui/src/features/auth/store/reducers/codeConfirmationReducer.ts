import type { PayloadAction } from '@reduxjs/toolkit';
import {
  setPending,
  setFulfilled,
  setRejected,
} from '../../../../utils/authSliceHelpers';
import type { AuthState, CodeConfirmationParams } from '../authSlice';

export const codeConfirmationReducer = {
  codeConfirmationInit: (state: AuthState, action: PayloadAction<{email: string}>) => {
    state.user.email = action.payload.email;
  },

  codeConfirmationRequest: (
    state: AuthState,
    _action: PayloadAction<CodeConfirmationParams>,
  ) => {
    setPending(state, {key: 'confirmCode'});
  },

  codeConfirmationSuccess: (state: AuthState, _action: PayloadAction<{email: string}>) => {
    setFulfilled(state, {
      loadingKey: 'confirmCode',
      errorKey: 'confirmCode',
    });
  },

  codeConfirmationFailure: (state: AuthState) => {
    setRejected(state, {
      loadingKey: 'confirmCode',
      errorKey: 'confirmCode',
      failureMessage: 'Signup failed',
    });
  },
};
