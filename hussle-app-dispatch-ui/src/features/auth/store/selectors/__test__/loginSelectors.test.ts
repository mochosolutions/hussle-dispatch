import {
  rememberMeSelector,
  userSessionSelector,
  selectIsLoggedIn,
} from '../loginSelectors';
import {AuthState} from '../../authSlice';

describe('Auth Selectors', () => {
  const mockState: {auth: AuthState} = {
    auth: {
      isLoggedIn: true,
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: '',
      },
      orgs: [],
      errors: {},
      loading: {},
      isInitializing: false,
      rememberMe: true,
      session: 'session-id',
      forceChangePassword: false,
      initAttempted: false,
    },
  };

  it('selectIsLoggedIn should return true', () => {
    expect(selectIsLoggedIn(mockState)).toBe(true);
  });

  it('rememberMeSelector should return true', () => {
    expect(rememberMeSelector(mockState)).toBe(true);
  });

  it('userSessionSelector should return session-id', () => {
    expect(userSessionSelector(mockState)).toBe('session-id');
  });
});
