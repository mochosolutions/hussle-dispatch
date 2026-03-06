import { passwordResetReducer } from '../passwordResetReducer';
import { setPending, setFulfilled, setRejected } from 'utils/authSliceHelpers';
import { defaultUserProfileState } from '../../authSlice';
import { PayloadAction } from '@reduxjs/toolkit';

// filepath: src/pages/auth/store/reducers/passwordResetReducer.test.ts

jest.mock('utils/authSliceHelpers', () => ({
  setPending: jest.fn(),
  setFulfilled: jest.fn(),
  setRejected: jest.fn(),
}));

describe('passwordResetReducer', () => {
  let mockState: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      user: { ...defaultUserProfileState },
      loading: {},
      errors: {},
    };
  });

  describe('initiatePasswordResetRequest', () => {
    it('should call setPending with correct key', () => {
      const action = { payload: { email: 'test@example.com' } } as PayloadAction<{ email: string }>;
      passwordResetReducer.initiatePasswordResetRequest(mockState, action);
      expect(setPending).toHaveBeenCalledWith(mockState, { key: 'initPasswordReset' });
    });
  });

  describe('initiatePasswordResetSuccess', () => {
    it('should call setFulfilled and set user email', () => {
      const action = { payload: { email: 'test@example.com' } } as PayloadAction<{ email: string }>;
      passwordResetReducer.initiatePasswordResetSuccess(mockState, action);
      expect(setFulfilled).toHaveBeenCalledWith(mockState, {
        loadingKey: 'initPasswordReset',
        errorKey: 'initPasswordReset',
      });
      expect(mockState.user.email).toBe('test@example.com');
    });
  });

  describe('initiatePasswordResetFailure', () => {
    it('should call setRejected with the correct message', () => {
      passwordResetReducer.initiatePasswordResetFailure(mockState);
      expect(setRejected).toHaveBeenCalledWith(mockState, {
        loadingKey: 'initPasswordReset',
        errorKey: 'initPasswordReset',
        failureMessage: 'Init Password Reset',
      });
    });
  });

  describe('confirmPasswordResetRequest', () => {
    it('should call setPending with correct key', () => {
      const action = {
        payload: { confirmationCode: '123456', newPassword: 'newPass123' },
      } as PayloadAction<{ confirmationCode: string; newPassword: string }>;
      passwordResetReducer.confirmPasswordResetRequest(mockState, action);
      expect(setPending).toHaveBeenCalledWith(mockState, { key: 'confirmPasswordReset' });
    });
  });

  describe('confirmPasswordResetSuccess', () => {
    it('should call setFulfilled', () => {
      passwordResetReducer.confirmPasswordResetSuccess(mockState);
      expect(setFulfilled).toHaveBeenCalledWith(mockState, {
        loadingKey: 'confirmPasswordReset',
        errorKey: 'confirmPasswordReset',
      });
    });
  });

  describe('confirmPasswordResetFailure', () => {
    it('should call setRejected with the correct message', () => {
      passwordResetReducer.confirmPasswordResetFailure(mockState);
      expect(setRejected).toHaveBeenCalledWith(mockState, {
        loadingKey: 'confirmPasswordReset',
        errorKey: 'confirmPasswordReset',
        failureMessage: 'Password Reset Password',
      });
    });
  });
});