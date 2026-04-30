import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { sendInvoice } from 'utils/api/invoices/invoiceApi';
import {
  sendInvoiceRequest,
  sendInvoiceSuccess,
  sendInvoiceFailure,
} from '../reducers/invoicePageSlice';
import { invoiceActions } from '../reducers/invoiceEntitySlice';

export function* sendInvoiceSaga(
  action: ReturnType<typeof sendInvoiceRequest>,
): Generator {
  const { id, recipientEmail, ccEmails } = action.payload;

  try {
    const response = (yield call(sendInvoice, id, {
      recipientEmail,
      ccEmails,
    })) as SagaReturnType<typeof sendInvoice>;

    yield put(invoiceActions.upsertOne(response));
    yield put(sendInvoiceSuccess({ id }));
    yield put(notify({ message: 'Invoice sent successfully', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send invoice';
    yield put(sendInvoiceFailure({ id, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
