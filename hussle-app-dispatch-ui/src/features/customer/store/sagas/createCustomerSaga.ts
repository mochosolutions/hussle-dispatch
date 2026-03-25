import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { createCustomer } from 'utils/api/fleet/customerApi';
import {
  createCustomerSuccess,
  createCustomerFailure,
  fetchCustomersRequest,
} from '../reducers/customerPageSlice';
import { customerActions } from '../reducers/customerEntitySlice';
import type { CreateRequestPayload } from '../../../../mocho/redux/createCrudSlice';
import type { CreateCustomerPayload } from '../../types';

export function* createCustomerSaga(
  action: PayloadAction<CreateRequestPayload<CreateCustomerPayload>>,
): Generator {
  try {
    const response = (yield call(createCustomer, action.payload.data)) as SagaReturnType<
      typeof createCustomer
    >;

    yield put(customerActions.addOne(response.customer));
    yield put(createCustomerSuccess({}));

    yield call(enqueueSnackbar, 'Customer created', { variant: 'success' });

    const { redirectTo, onCreated } = action.payload;
    if (onCreated) {
      onCreated(response.customer.id);
    }
    if (redirectTo) {
      const navigate = (yield call(getNavigate)) as (path: string) => void;
      yield call(navigate, redirectTo);
    }

    yield put(fetchCustomersRequest({ page: 1, limit: 25 }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
    yield put(createCustomerFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
