import { call, put } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { deleteInvoice } from 'utils/api/invoices/invoiceApi';
import {
  deleteInvoiceRequest,
  deleteInvoiceSuccess,
  deleteInvoiceFailure,
} from '../reducers/invoicePageSlice';
import { invoiceActions } from '../reducers/invoiceEntitySlice';

export function* deleteInvoiceSaga(
  action: ReturnType<typeof deleteInvoiceRequest>,
): Generator {
  const { id } = action.payload;

  try {
    yield call(deleteInvoice, id);

    yield put(invoiceActions.removeOne(id));
    yield put(deleteInvoiceSuccess({ id }));
    yield call(enqueueSnackbar, 'Invoice deleted', { variant: 'success' });

    const navigate = (yield call(getNavigate)) as (path: string) => void;
    yield call(navigate, '/invoices');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete invoice';
    yield put(deleteInvoiceFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
