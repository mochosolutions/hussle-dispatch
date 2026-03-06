import {PayloadAction} from '@reduxjs/toolkit';

export const refreshTokenReducer = {
  refreshTokenSuccess: (state, action: PayloadAction<{}>) => {
    // Token refresh handled by cookies - no state update needed
  },
  refreshTokenFailure: (state) => {
    state.isLoggedIn = false;
  },
};
