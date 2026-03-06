// import { PayloadAction } from "@reduxjs/toolkit";
import {
  setPending,
  setFulfilled,
  setRejected,
} from '../../../../utils/authSliceHelpers';

export const resendCodeReducer = {
  resendCodeRequest: (state) => {
    setPending(state, {key: 'confirmCode'});
  },

  resendCodeSuccess: (state) => {
    setFulfilled(state, {
      loadingKey: 'confirmCode',
      errorKey: 'confirmCode',
    });
  },

  resendCodeFailure: (state) => {
    setRejected(state, {
      loadingKey: 'confirmCode',
      errorKey: 'confirmCode',
      failureMessage: 'Resend code failed',
    });
  },
};
