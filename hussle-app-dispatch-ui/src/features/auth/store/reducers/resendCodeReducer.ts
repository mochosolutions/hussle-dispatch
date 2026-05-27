import type { AuthState } from '../authSlice';
import {
  setPending,
  setFulfilled,
  setRejected,
} from '../../../../utils/authSliceHelpers';

export const resendCodeReducer = {
  resendCodeRequest: (state: AuthState) => {
    setPending(state, { key: 'confirmCode' });
  },

  resendCodeSuccess: (state: AuthState) => {
    setFulfilled(state, {
      loadingKey: 'confirmCode',
      errorKey: 'confirmCode',
    });
  },

  resendCodeFailure: (state: AuthState) => {
    setRejected(state, {
      loadingKey: 'confirmCode',
      errorKey: 'confirmCode',
      failureMessage: 'Resend code failed',
    });
  },
};
