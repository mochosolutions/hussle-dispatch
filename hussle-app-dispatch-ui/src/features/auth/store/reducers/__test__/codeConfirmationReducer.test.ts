import { codeConfirmationReducer } from '../codeConfirmationReducer';
import * as authSliceHelpers from 'utils/authSliceHelpers';

interface TestState {
  user: { email: string };
  loading: Record<string, any>;
  errors: Record<string, string>;
}

describe('codeConfirmationReducer', () => {
  let state: TestState;

  beforeEach(() => {
    state = {
      user: { email: '' },
      loading: {},
      errors: {},
    };
  });

  describe('codeConfirmationInit', () => {
    it('should update the user email', () => {
      const email = 'user@example.com';
      const action = { type: 'auth/codeConfirmationInit', payload: { email } };
      codeConfirmationReducer.codeConfirmationInit(state, action);
      expect(state.user.email).toBe(email);
    });
  });

  describe('codeConfirmationRequest', () => {
    it('should call setPending with the correct key', () => {
      const setPendingSpy = jest.spyOn(authSliceHelpers, 'setPending');
      const payload = {
        confirmationCode: '123456',
        // navigate: jest.fn(),
      };
      const action = { type: 'auth/codeConfirmationRequest', payload };

      codeConfirmationReducer.codeConfirmationRequest(state, action);
      expect(setPendingSpy).toHaveBeenCalledWith(state, { key: 'confirmCode' });
      setPendingSpy.mockRestore();
    });
  });

  describe('codeConfirmationSuccess', () => {
    it('should call setFulfilled with the correct parameters', () => {
      const setFulfilledSpy = jest.spyOn(authSliceHelpers, 'setFulfilled');
      const email = 'user@example.com';
      const action = { type: 'auth/codeConfirmationSuccess', payload: { email } };

      codeConfirmationReducer.codeConfirmationSuccess(state, action);
      expect(setFulfilledSpy).toHaveBeenCalledWith(state, {
        loadingKey: 'confirmCode',
        errorKey: 'confirmCode',
      });
      setFulfilledSpy.mockRestore();
    });
  });

  describe('codeConfirmationFailure', () => {
    it('should call setRejected with the correct parameters', () => {
      const setRejectedSpy = jest.spyOn(authSliceHelpers, 'setRejected');
      const action = { type: 'auth/codeConfirmationFailure' };

      codeConfirmationReducer.codeConfirmationFailure(state);
      expect(setRejectedSpy).toHaveBeenCalledWith(state, {
        loadingKey: 'confirmCode',
        errorKey: 'confirmCode',
        failureMessage: 'Signup failed',
      });
      setRejectedSpy.mockRestore();
    });
  });
});

