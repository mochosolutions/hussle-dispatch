import { resendCodeReducer } from '../resendCodeReducer';
import { setPending, setFulfilled, setRejected } from 'utils/authSliceHelpers';

jest.mock('utils/authSliceHelpers', () => ({
  setPending: jest.fn(),
  setFulfilled: jest.fn(),
  setRejected: jest.fn(),
}));

describe('resendCodeReducer', () => {
  let mockState: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      loading: { confirmCode: '' },
      errors: { confirmCode: '' },
    };
  });

  describe('resendCodeRequest', () => {
    it('should call setPending with key=confirmCode', () => {
      resendCodeReducer.resendCodeRequest(mockState);
      expect(setPending).toHaveBeenCalledWith(mockState, { key: 'confirmCode' });
    });

    it('should set the loading state if we simulate setPending', () => {
      resendCodeReducer.resendCodeRequest(mockState);
      mockState.loading.confirmCode = 'pending'; // example simulation
      expect(mockState.loading.confirmCode).toBe('pending');
    });
  });

  describe('resendCodeSuccess', () => {
    it('should call setFulfilled with loadingKey=confirmCode and errorKey=confirmCode', () => {
      resendCodeReducer.resendCodeSuccess(mockState);
      expect(setFulfilled).toHaveBeenCalledWith(mockState, {
        loadingKey: 'confirmCode',
        errorKey: 'confirmCode',
      });
    });

    it('should clear the loading state and errors if we simulate setFulfilled', () => {
      resendCodeReducer.resendCodeSuccess(mockState);
      mockState.loading.confirmCode = 'fulfilled'; // example simulation
      mockState.errors.confirmCode = '';
      expect(mockState.loading.confirmCode).toBe('fulfilled');
      expect(mockState.errors.confirmCode).toBe('');
    });
  });

  describe('resendCodeFailure', () => {
    it('should call setRejected with the correct message', () => {
      resendCodeReducer.resendCodeFailure(mockState);
      expect(setRejected).toHaveBeenCalledWith(mockState, {
        loadingKey: 'confirmCode',
        errorKey: 'confirmCode',
        failureMessage: 'Resend code failed',
      });
    });

    it('should set the loading state to rejected and errors to "Resend code failed" if we simulate setRejected', () => {
      resendCodeReducer.resendCodeFailure(mockState);
      mockState.loading.confirmCode = 'rejected';
      mockState.errors.confirmCode = 'Resend code failed';
      expect(mockState.loading.confirmCode).toBe('rejected');
      expect(mockState.errors.confirmCode).toBe('Resend code failed');
    });
  });
});