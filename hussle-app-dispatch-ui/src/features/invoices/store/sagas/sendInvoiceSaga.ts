import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
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
  const { id, recipientEmail } = action.payload;

  try {
    const response = (yield call(sendInvoice, id, {
      recipientEmail,
    })) as SagaReturnType<typeof sendInvoice>;

    yield put(invoiceActions.upsertOne(response));
    yield put(sendInvoiceSuccess({ id }));
    yield call(enqueueSnackbar, 'Invoice sent successfully', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send invoice';
    yield put(sendInvoiceFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
