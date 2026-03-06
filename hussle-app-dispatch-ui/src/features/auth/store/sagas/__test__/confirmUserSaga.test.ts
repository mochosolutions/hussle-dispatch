// authSagas.test.ts

import { call, select } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';

import {
  handleConfirmCode,
  handleResendCode,
} from '../confirmUserSaga'; // adjust the path as needed
import {
  codeConfirmationSuccess,
  codeConfirmationFailure,
  resendCodeSuccess,
  resendCodeFailure,
} from '../../authSlice'; // adjust the path as needed
import { currentUserSelector } from '../../selectors'; // adjust the path as needed
import axiosPrivate from 'utils/axios';
import { getNavigate } from 'utils/getNavigate';


jest.mock('utils/axios', () => ({
    __esModule: true,
    default: {
      baseURL: 'http://fake-api-url',
      post: jest.fn(),
      get: jest.fn(),
    },
}));

// --- Tests for handleConfirmCode Saga ---
describe('handleConfirmCode Saga', () => {
  // Create a fake navigate function to simulate redirection
  const fakeNavigate: jest.Mock = jest.fn();
  const fakeUser = { email: 'test@example.com' };
  const fakeConfirmationCode = '123456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles code confirmation successfully', async () => {
    await expectSaga(handleConfirmCode, {
      payload: { confirmationCode: fakeConfirmationCode },
    })
      .provide([
        // Provide the navigate function
        [call(getNavigate), fakeNavigate],
        // Provide the user from the selector
        [select(currentUserSelector), fakeUser],
        // Provide a successful API call response for code confirmation
        [
          call(axiosPrivate.post, '/auth/signup/confirm', {
            confirmationCode: fakeConfirmationCode,
            email: fakeUser.email,
          }),
          {}, // Response data is not used further
        ],
      ])
      // Expect the saga to dispatch the success action with the user's email
      .put(codeConfirmationSuccess({ email: fakeUser.email }))
      // Expect the saga to call navigate with '/login'
      .call(fakeNavigate, '/login')
      .run();
  });

  it('handles code confirmation failure', async () => {
    const error = new Error('Confirmation failed');

    await expectSaga(handleConfirmCode, {
      payload: { confirmationCode: fakeConfirmationCode },
    })
      .provide([
        [call(getNavigate), fakeNavigate],
        [select(currentUserSelector), fakeUser],
        // Simulate an error when calling the confirm API endpoint
        [
          call(axiosPrivate.post, '/auth/signup/confirm', {
            confirmationCode: fakeConfirmationCode,
            email: fakeUser.email,
          }),
          throwError(error),
        ],
      ])
      // Expect the saga to dispatch the failure action on error
      .put(codeConfirmationFailure())
      .run();
  });
});

// --- Tests for handleResendCode Saga ---
describe('handleResendCode Saga', () => {
  const fakeUser = { email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles resend code successfully', async () => {
    const fakeResponse = { data: {} };

    await expectSaga(handleResendCode, { payload: {} })
      .provide([
        [select(currentUserSelector), fakeUser],
        [
          call(axiosPrivate.post, '/auth/signup/resend-code', {
            email: fakeUser.email,
          }),
          fakeResponse,
        ],
      ])
      .put(resendCodeSuccess())
      .run();
  });

  it('handles resend code failure', async () => {
    const error = new Error('Resend code failed');

    await expectSaga(handleResendCode, { payload: {} })
      .provide([
        [select(currentUserSelector), fakeUser],
        [
          call(axiosPrivate.post, '/auth/signup/resend-code', {
            email: fakeUser.email,
          }),
          throwError(error),
        ],
      ])
      .put(resendCodeFailure())
      .run();
  });
});
