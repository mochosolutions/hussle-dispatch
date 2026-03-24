import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { updateCustomer } from 'utils/api/fleet/customerApi';
import {
  updateCustomerSuccess,
  updateCustomerFailure,
} from '../reducers/customerPageSlice';
import { customerActions } from '../reducers/customerEntitySlice';
import type { UpdateRequestPayload } from '../../../../mocho/redux/createCrudSlice';
import type { UpdateCustomerPayload } from '../../types';

export function* updateCustomerSaga(
  action: PayloadAction<UpdateRequestPayload<UpdateCustomerPayload>>,
): Generator {
  try {
    const { id, data } = action.payload;

    const response = (yield call(updateCustomer, id, data)) as SagaReturnType<
      typeof updateCustomer
    >;

    yield put(customerActions.updateOne({ id, changes: response.customer }));
    yield put(updateCustomerSuccess({ id }));

    yield call(enqueueSnackbar, 'Customer updated', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';
    yield put(updateCustomerFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
