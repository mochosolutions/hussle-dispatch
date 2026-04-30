import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { createFromLoad } from 'utils/api/invoices/invoiceApi';
import { getNavigate } from 'utils/getNavigate';
import {
  createFromLoadRequest,
  createFromLoadSuccess,
  createFromLoadFailure,
} from '../reducers/invoicePageSlice';
import { invoiceActions } from '../reducers/invoiceEntitySlice';

export function* createFromLoadSaga(
  action: ReturnType<typeof createFromLoadRequest>,
): Generator {
  const { loadId } = action.payload;

  try {
    const response = (yield call(createFromLoad, loadId)) as SagaReturnType<typeof createFromLoad>;

    yield put(invoiceActions.upsertOne(response));
    yield put(createFromLoadSuccess({ id: response.id }));
    yield put(notify({ message: 'Invoice created from load', variant: 'success' }));

    const navigate = (yield call(getNavigate)) as (path: string) => void;
    yield call(navigate, `/invoices/${response.id}`);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create invoice from load';
    yield put(createFromLoadFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
