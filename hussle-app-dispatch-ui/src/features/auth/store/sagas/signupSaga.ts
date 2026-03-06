import {call, put} from 'redux-saga/effects';
import axiosPrivate from 'utils/axios';
import {getNavigate} from 'utils/getNavigate';
import {signupFailure, signupSuccess, codeConfirmationInit} from '../authSlice';

export function* handleRegister(action) {
  try {
    console.log('handle Register called...');
    const {email, password, name, firstName, lastName} = action.payload;
    const navigate = yield call(getNavigate);
    const signupRequestBody = {
      email,
      password,
      orgName: name, // Backend expects orgName, not name
      firstName,
      lastName,
      // orgRole and orgVertical are optional - backend will use defaults
    };

    const response = yield call(
      axiosPrivate.post,
      '/auth/signup',
      signupRequestBody,
    );

    const {user, tenant} = response.data;
    console.log('Registered user:', { user, tenant });
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

    // console.log("Register response", response);
    yield put(codeConfirmationInit({email: formattedUser.email}));
    yield put(signupSuccess({user: formattedUser, tenant: formattedTenant}));
    yield call(navigate, '/code-verification');
  } catch (error) {
    console.error('Error registering user', error);
    yield put(signupFailure());
  }
}
