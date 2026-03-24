import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getCustomer } from 'utils/api/fleet/customerApi';
import {
  fetchCustomerDetailsRequest,
  fetchCustomerDetailsSuccess,
  fetchCustomerDetailsFailure,
} from '../reducers/customerPageSlice';
import { customerActions } from '../reducers/customerEntitySlice';

export function* fetchCustomerDetailsSaga(
  action: ReturnType<typeof fetchCustomerDetailsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const response = (yield call(getCustomer, id)) as SagaReturnType<typeof getCustomer>;

    yield put(customerActions.upsertOne(response.customer));
    yield put(fetchCustomerDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load customer details';
    yield put(fetchCustomerDetailsFailure({ error: errorMessage, id }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
