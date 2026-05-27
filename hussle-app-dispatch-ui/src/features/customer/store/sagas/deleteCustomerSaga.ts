import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { isAxiosError } from 'axios';
import { deleteCustomer } from 'utils/api/fleet/customerApi';
import {
  deleteCustomerRequest,
  deleteCustomerSuccess,
  deleteCustomerFailure,
} from '../reducers/customerPageSlice';
import { customerActions } from '../reducers/customerEntitySlice';

export function* deleteCustomerSaga(action: ReturnType<typeof deleteCustomerRequest>): Generator {
  const { id } = action.payload;

  try {
    yield call(deleteCustomer, id);

    yield put(customerActions.removeOne(id));
    yield put(deleteCustomerSuccess({ id }));

    yield put(notify({ message: 'Customer deleted', variant: 'success' }));
  } catch (error: unknown) {
    let errorMessage: string;

    if (isAxiosError(error) && error.response?.status === 409) {
      errorMessage = 'Cannot delete: customer has active loads';
    } else {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete customer';
    }

    yield put(notify({ message: errorMessage, variant: 'error' }));
    yield put(deleteCustomerFailure({ error: errorMessage, id }));
  }
}
