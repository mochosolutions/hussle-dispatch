import { setPending, setFulfilled, setRejected } from '../../../../utils/authSliceHelpers';
import { AuthState } from '../authSlice';
import { LoadingState } from '../../../../types/loadingState';

interface MockAuthState {
  loading: Record<string, any>;
  errors: Record<string, any>;
}

describe('authSliceHelpers', () => {
  let mockState: MockAuthState;

  beforeEach(() => {
    mockState = {
      loading: {},
      errors: {},
    };
  });

  describe('setPending', () => {
    it('should set loading to Pending for the given key', () => {
      setPending(mockState as AuthState, { key: 'signup' });
      expect(mockState.loading.signup).toBe(LoadingState.Pending);
    });
  });

  describe('setFulfilled', () => {
    it('should set loading to Fulfilled and clear error for the given keys', () => {
      mockState.loading.login = LoadingState.Pending;
      mockState.errors.login = 'Some error';
      
      setFulfilled(mockState as AuthState, { loadingKey: 'login', errorKey: 'login' });
      expect(mockState.loading.login).toBe(LoadingState.Fulfilled);
      expect(mockState.errors.login).toBe('');
    });
  });

  describe('setRejected', () => {
    it('should set loading to Rejected and register error message for the given keys', () => {
      // Pre-set a loading state to simulate an in-progress action
      mockState.loading.forgotPassword = LoadingState.Pending;
      
      setRejected(mockState as AuthState, {
        loadingKey: 'forgotPassword',
        errorKey: 'forgotPassword',
        failureMessage: 'Operation failed',
      });
      expect(mockState.loading.forgotPassword).toBe(LoadingState.Rejected);
      expect(mockState.errors.forgotPassword).toBe('Operation failed');
    });
  });
});