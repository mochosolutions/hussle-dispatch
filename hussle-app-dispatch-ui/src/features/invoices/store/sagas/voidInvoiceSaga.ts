import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { voidInvoice } from 'utils/api/invoices/invoiceApi';
import {
  voidInvoiceRequest,
  voidInvoiceSuccess,
  voidInvoiceFailure,
} from '../reducers/invoicePageSlice';
import { invoiceActions } from '../reducers/invoiceEntitySlice';

export function* voidInvoiceSaga(
  action: ReturnType<typeof voidInvoiceRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const response = (yield call(voidInvoice, id)) as SagaReturnType<typeof voidInvoice>;

    yield put(invoiceActions.upsertOne(response));
    yield put(voidInvoiceSuccess({ id }));
    yield put(notify({ message: 'Invoice voided', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to void invoice';
    yield put(voidInvoiceFailure({ id, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
