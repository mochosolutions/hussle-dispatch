import { PayloadAction } from '@reduxjs/toolkit';
import { initReducer } from '../initReducer';
import { UserProfile, defaultUserProfileState } from '../../authSlice';

describe('initReducer', () => {
  let mockState: any;

  beforeEach(() => {
    mockState = {
      isInitializing: false,
      isLoggedIn: false,
      user: { ...defaultUserProfileState },
      orgs: [],
      errors: { init: '' },
      initAttempted: false,
    };
  });

  describe('initRequest', () => {
    it('should set isInitializing to true', () => {
      initReducer.initRequest(mockState);
      expect(mockState.isInitializing).toBe(true);
    });
  });

  describe('initSuccess', () => {
    it('should set isInitializing to false, isLoggedIn to true, update user & orgs, clear errors, and set initAttempted to true', () => {
      const payload = {
        user: { email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'user' } as UserProfile,
        orgs: [{organizationId: 'org-1', orgName: 'Test Org'}],
      };
      const action = { payload } as PayloadAction<typeof payload>;

      initReducer.initSuccess(mockState, action);

      expect(mockState.isInitializing).toBe(false);
      expect(mockState.isLoggedIn).toBe(true);
      expect(mockState.user).toEqual(payload.user);
      expect(mockState.orgs).toEqual(payload.orgs);
      expect(mockState.errors.init).toBe('');
      expect(mockState.initAttempted).toBe(true);
    });
  });

  describe('initFailure', () => {
    it('should set isInitializing to false, isLoggedIn to false, reset user, and set initAttempted to true', () => {
      initReducer.initFailure(mockState);
      expect(mockState.isInitializing).toBe(false);
      expect(mockState.isLoggedIn).toBe(false);
      expect(mockState.user).toEqual(defaultUserProfileState);
      expect(mockState.initAttempted).toBe(true);
    });
  });
});