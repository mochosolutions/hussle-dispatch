import { PayloadAction } from '@reduxjs/toolkit';
import { refreshTokenReducer } from '../refreshTokenReducer';
import { UserProfile, defaultUserProfileState } from '../../authSlice';



describe('refreshTokenReducer', () => {
    let mockState: any;

    beforeEach(() => {
      mockState = {
        isLoggedIn: true,
      };
    });

    describe('refreshTokenSuccess', () => {
      it('should not modify state (cookies handle token refresh)', () => {
        const action = { type: "", payload: {} };
        const stateBefore = { ...mockState };
        refreshTokenReducer.refreshTokenSuccess(mockState, action);
        // Refresh is a no-op for cookie-based auth
        expect(mockState).toEqual(stateBefore);
      });
    });

    describe('refreshTokenFailure', () => {
      it('should set isLoggedIn to false', () => {
        refreshTokenReducer.refreshTokenFailure(mockState);
        expect(mockState.isLoggedIn).toBe(false);
      });
    });
  });
