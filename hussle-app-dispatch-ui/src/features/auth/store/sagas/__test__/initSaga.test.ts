// initializeAuthSaga.test.ts

import { call, select } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';

import { initializeAuthSaga } from '../initSaga';
import { initSuccess, initFailure } from '../../authSlice';
import { initAttemptedSelector, selectIsLoggedIn } from '../../selectors';
import axiosPrivate from 'utils/axios';

// Mock axios
jest.mock('utils/axios', () => ({
  __esModule: true,
  default: {
    baseURL: 'http://fake-api-url',
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockUser = {
  id: "1",
  name: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  role: 'user'
};

const mockOrgs = [
  {
    role: 'admin',
    status: 'active',
    membershipId: 'mem-123',
    userId: 'user-123',
    orgName: 'Test Org',
    orgSubscriptionTier: 'PRO',
    orgStatus: 'active',
    organizationId: 'org-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

describe('initializeAuthSaga', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('exits early if initialization has already been attempted', async () => {
    await expectSaga(initializeAuthSaga)
      .provide([
        // Simulate that initialization has already been attempted
        [select(initAttemptedSelector), true],
        [select(selectIsLoggedIn), false],
      ])
      .run()
      .then((result) => {
        // No put effects should have been dispatched
        expect(result.effects.put).toBeUndefined();
      });
  });

  it('exits early if user is already logged in', async () => {
    await expectSaga(initializeAuthSaga)
      .provide([
        [select(initAttemptedSelector), false],
        [select(selectIsLoggedIn), true],
      ])
      .run()
      .then((result) => {
        // No put effects should have been dispatched
        expect(result.effects.put).toBeUndefined();
      });
  });

  it('handles a successful authentication check via cookies', async () => {
    const fakeUserResponse = {
      data: {
        user: mockUser,
        accessibleOrgs: mockOrgs
      }
    };

    await expectSaga(initializeAuthSaga)
      .provide([
        [select(initAttemptedSelector), false],
        [select(selectIsLoggedIn), false],
        // Mock the /auth/me endpoint call
        [call(axiosPrivate.get, '/auth/me'), fakeUserResponse],
      ])
      .put(
        initSuccess({
          user: mockUser,
          orgs: mockOrgs,
        })
      )
      .run();
  });

  it('handles an error when authentication check fails', async () => {
    const error = new Error('Authentication failed');

    await expectSaga(initializeAuthSaga)
      .provide([
        [select(initAttemptedSelector), false],
        [select(selectIsLoggedIn), false],
        // Simulate an error when calling /auth/me
        [call(axiosPrivate.get, '/auth/me'), throwError(error)],
      ])
      .put(initFailure())
      .run();
  });
});
