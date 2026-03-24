import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState } from '../authSlice';

export const refreshTokenReducer = {
  refreshTokenSuccess: (_state: AuthState, _action: PayloadAction<Record<string, never>>) => {
    // Token refresh handled by cookies - no state update needed
  },
  refreshTokenFailure: (state: AuthState) => {
    state.isLoggedIn = false;
  },
};
