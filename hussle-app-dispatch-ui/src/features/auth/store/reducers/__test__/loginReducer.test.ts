import { loginReducer } from '../loginReducer';
import { setPending, setFulfilled, setRejected } from 'utils/authSliceHelpers';
import { defaultUserProfileState } from '../../authSlice';
import { PayloadAction } from '@reduxjs/toolkit';

// filepath: src/pages/auth/store/reducers/loginReducer.test.ts

jest.mock('utils/authSliceHelpers', () => ({
  setPending: jest.fn(),
  setFulfilled: jest.fn(),
  setRejected: jest.fn(),
}));

describe('loginReducer', () => {
  let mockState: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      isLoggedIn: false,
      user: { ...defaultUserProfileState },
      rememberMe: false,
      initAttempted: false,
      orgs: [],
      loading: {},
      errors: {},
    };
  });

  describe('loginRequest', () => {
    it('should call setPending with key=login', () => {
      const action = {
        payload: {
          data: { email: 'test@example.com', password: '123', rememberMe: true },
          navigate: jest.fn(),
        },
      } as PayloadAction<any>;

      loginReducer.loginRequest(mockState, action);
      expect(setPending).toHaveBeenCalledWith(mockState, { key: 'login' });
    });
  });

  describe('loginSuccess', () => {
    it('should update state with user, orgs, rememberMe and call setFulfilled', () => {
      const action = {
        payload: {
          user: { email: 'test@example.com' },
          orgs: [{organizationId: 'org-1', orgName: 'Test Org'}],
          rememberMe: true,
        },
      } as PayloadAction<any>;

      loginReducer.loginSuccess(mockState, action);

      expect(mockState.isLoggedIn).toBe(true);
      expect(mockState.user).toEqual({ email: 'test@example.com' });
      expect(mockState.orgs).toEqual([{organizationId: 'org-1', orgName: 'Test Org'}]);
      expect(setFulfilled).toHaveBeenCalledWith(mockState, {
        loadingKey: 'login',
        errorKey: 'login',
      });
      expect(mockState.rememberMe).toBe(true);
      expect(mockState.initAttempted).toBe(true);
    });
  });

  describe('loginFailure', () => {
    it('should call setRejected with error message and reset user', () => {
      const action = {
        payload: { error: 'Invalid credentials' },
      } as PayloadAction<{ error: string }>;

      loginReducer.loginFailure(mockState, action);
      expect(setRejected).toHaveBeenCalledWith(mockState, {
        loadingKey: 'login',
        errorKey: 'login',
        failureMessage: 'Invalid credentials',
      });
      expect(mockState.isLoggedIn).toBe(false);
      expect(mockState.user).toEqual(defaultUserProfileState);
    });
  });
});