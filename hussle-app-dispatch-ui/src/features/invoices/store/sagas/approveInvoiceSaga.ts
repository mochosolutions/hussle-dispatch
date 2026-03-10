import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { approveInvoice } from 'utils/api/invoices/invoiceApi';
import {
  approveInvoiceRequest,
  approveInvoiceSuccess,
  approveInvoiceFailure,
} from '../reducers/invoicePageSlice';
import { invoiceActions } from '../reducers/invoiceEntitySlice';

export function* approveInvoiceSaga(
  action: ReturnType<typeof approveInvoiceRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const response = (yield call(approveInvoice, id)) as SagaReturnType<typeof approveInvoice>;

    yield put(invoiceActions.upsertOne(response.invoice));
    yield put(approveInvoiceSuccess({ id }));
    yield call(enqueueSnackbar, 'Invoice approved', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to approve invoice';
    yield put(approveInvoiceFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
