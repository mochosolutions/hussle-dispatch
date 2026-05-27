import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getCustomers } from 'utils/api/fleet/customerApi';
import { fetchCustomersSuccess, fetchCustomersFailure } from '../reducers/customerPageSlice';
import { customerActions } from '../reducers/customerEntitySlice';
import type { CustomerListParams } from '../../types';

export function* fetchCustomersSaga(action: PayloadAction<CustomerListParams>): Generator {
  try {
    const response = (yield call(getCustomers, action.payload)) as SagaReturnType<
      typeof getCustomers
    >;

    yield put(customerActions.setAll(response.data));
    yield put(
      fetchCustomersSuccess({
        total: response.meta.total,
        page: response.meta.page,
        limit: response.meta.limit,
      }),
    );
  } catch (_error: unknown) {
    const errorMessage = 'Unable to load customers. Please try again.';
    yield put(fetchCustomersFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
