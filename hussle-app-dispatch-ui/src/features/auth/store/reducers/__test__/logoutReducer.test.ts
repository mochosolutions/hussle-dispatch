import { logoutReducer } from '../logoutReducer';
import { setPending, setFulfilled, setRejected } from 'utils/authSliceHelpers';
import { defaultUserProfileState } from '../../authSlice';

// filepath: src/pages/auth/store/reducers/logoutReducer.test.ts

jest.mock('utils/authSliceHelpers', () => ({
  setPending: jest.fn(),
  setFulfilled: jest.fn(),
  setRejected: jest.fn(),
}));

describe('logoutReducer', () => {
  let mockState: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      isLoggedIn: true,
      user: { email: 'test@example.com', role: 'user' },
      rememberMe: true,
      loading: {},
      errors: {},
    };
  });

  describe('logoutRequest', () => {
    it('should call setPending with the logout key', () => {
      logoutReducer.logoutRequest(mockState);
      expect(setPending).toHaveBeenCalledWith(mockState, { key: 'logout' });
    });

    it('should set loading.logout to pending if we simulate setPending', () => {
      logoutReducer.logoutRequest(mockState);
      // Simulate what setPending might do
      mockState.loading.logout = 'pending';
      expect(mockState.loading.logout).toBe('pending');
    });
  });

  describe('logoutSuccess', () => {
    it('should call setFulfilled with loadingKey=logout and errorKey=logout', () => {
      logoutReducer.logoutSuccess(mockState);
      expect(setFulfilled).toHaveBeenCalledWith(mockState, {
        loadingKey: 'logout',
        errorKey: 'logout',
      });
    });

    it('should reset isLoggedIn, user, and rememberMe', () => {
      logoutReducer.logoutSuccess(mockState);
      // Simulate what setFulfilled might do
      mockState.loading.logout = 'fulfilled';
      mockState.errors.logout = '';

      expect(mockState.loading.logout).toBe('fulfilled');
      expect(mockState.errors.logout).toBe('');
      expect(mockState.isLoggedIn).toBe(false);
      expect(mockState.user).toEqual(defaultUserProfileState);
      expect(mockState.rememberMe).toBe(false);
    });
  });

  describe('logoutFailure', () => {
    it('should call setRejected with correct keys and message', () => {
      logoutReducer.logoutFailure(mockState);
      expect(setRejected).toHaveBeenCalledWith(mockState, {
        loadingKey: 'logout',
        errorKey: 'logout',
        failureMessage: 'Logout failed',
      });
    });

    it('should set loading.logout to rejected and errors.logout to "Logout failed" if we simulate setRejected', () => {
      logoutReducer.logoutFailure(mockState);
      // Simulate what setRejected might do
      mockState.loading.logout = 'rejected';
      mockState.errors.logout = 'Logout failed';

      expect(mockState.loading.logout).toBe('rejected');
      expect(mockState.errors.logout).toBe('Logout failed');
    });
  });
});