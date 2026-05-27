import {call, put} from 'redux-saga/effects';
import axiosPrivate from 'utils/axios';
import {getNavigate} from 'utils/getNavigate';
import {signupFailure, signupSuccess, codeConfirmationInit} from '../authSlice';

export function* handleRegister(action) {
  try {
    const {email, password, orgName, firstName, lastName, orgRole, mcNumber, dotNumber} = action.payload;
    const navigate = yield call(getNavigate);
    const signupRequestBody = {
      email,
      password,
      orgName,
      firstName,
      lastName,
      orgRole,
      customMetadata: {
        mcNumber,
        dotNumber,
      },
    };

    const response = yield call(
      axiosPrivate.post,
      '/auth/signup',
      signupRequestBody,
    );

    const {user, tenant} = response.data;
    const formattedUser = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      id: user.id,
    };
    const formattedTenant = {
      id: tenant.tenantId,
      name: tenant.name,
      status: tenant.status,
      subscriptionTier: tenant.subscriptionTier,
    };

    yield put(codeConfirmationInit({email: formattedUser.email}));
    yield put(signupSuccess({user: formattedUser, tenant: formattedTenant}));
    yield call(navigate, '/code-verification');
  } catch (_error: unknown) {
    yield put(signupFailure());
  }
}
