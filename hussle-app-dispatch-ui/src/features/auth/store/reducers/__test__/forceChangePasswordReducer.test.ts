import { forceChangePasswordReducer } from '../forceChangePasswordReducer';
import * as authSliceHelpers from 'utils/authSliceHelpers';

describe('forceChangePasswordSessionInit', () => {
  let mockState;
  let mockAction;

  beforeEach(() => {
    mockState = {
      user: { email: '', firstName: '', lastName: '', role: '' },
      session: '',
      rememberMe: false,
      forceChangePassword: false,
      isLoggedIn: false,
      errors: {},
      loading: {},
    };
    mockAction = {
      payload: {
        user: { email: 'test@example.com', firstName: 'John', lastName: 'Doe', role: 'user' },
        session: 'test-session',
        rememberMe: true,
      },
    };
  });

  it('should call setPending with the correct key', () => {
    const setPendingSpy = jest.spyOn(authSliceHelpers, 'setPending');
    forceChangePasswordReducer.forceChangePasswordSessionInit(mockState, mockAction);
    expect(setPendingSpy).toHaveBeenCalledWith(mockState, { key: 'forceChangePassword' });
  });

  it('should set the user, session, rememberMe, and forceChangePassword in state', () => {
    forceChangePasswordReducer.forceChangePasswordSessionInit(mockState, mockAction);
    expect(mockState.user).toEqual(mockAction.payload.user);
    expect(mockState.session).toBe(mockAction.payload.session);
    expect(mockState.rememberMe).toBe(true);
    expect(mockState.forceChangePassword).toBe(true);
  });
});

describe('forceChangePasswordRequest', () => {
  let mockState;
  let mockAction;

  beforeEach(() => {
    mockState = {
      loading: {},
      errors: {},
    };
    mockAction = {
      payload: { password: 'new-secret-password' },
    };
  });

  it('should call setPending with the correct key', () => {
    const setPendingSpy = jest.spyOn(authSliceHelpers, 'setPending');
    forceChangePasswordReducer.forceChangePasswordRequest(mockState, mockAction);
    expect(setPendingSpy).toHaveBeenCalledWith(mockState, { key: 'forceChangePassword' });
  });
});

describe('forceChangePasswordSuccess', () => {
  let mockState;
  let mockAction;

  beforeEach(() => {
    mockState = {
      isLoggedIn: false,
      session: '',
      forceChangePassword: true,
      errors: {},
      loading: {},
    };
    mockAction = {
      payload: {
        session: 'updated-session',
      },
    };
  });

  it('should mark user as logged in', () => {
    forceChangePasswordReducer.forceChangePasswordSuccess(mockState, mockAction);
    expect(mockState.isLoggedIn).toBe(true);
  });

  it('should call setFulfilled with the correct keys', () => {
    const setFulfilledSpy = jest.spyOn(authSliceHelpers, 'setFulfilled');
    forceChangePasswordReducer.forceChangePasswordSuccess(mockState, mockAction);
    expect(setFulfilledSpy).toHaveBeenCalledWith(mockState, {
      loadingKey: 'forceChangePassword',
      errorKey: 'forceChangePassword',
    });
  });

  it('should update session and disable forceChangePassword', () => {
    forceChangePasswordReducer.forceChangePasswordSuccess(mockState, mockAction);
    expect(mockState.session).toBe(mockAction.payload.session);
    expect(mockState.forceChangePassword).toBe(false);
  });
});

describe('forceChangePasswordFailure', () => {
  let mockState;

  beforeEach(() => {
    mockState = {
      errors: {},
      loading: {},
    };
  });

  it('should call setRejected with the correct keys', () => {
    const setRejectedSpy = jest.spyOn(authSliceHelpers, 'setRejected');
    forceChangePasswordReducer.forceChangePasswordFailure(mockState);
    expect(setRejectedSpy).toHaveBeenCalledWith(mockState, {
      loadingKey: 'forceChangePassword',
      errorKey: 'forceChangePassword',
      failureMessage: 'Force change password failed',
    });
  });
});