import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getInvoice } from 'utils/api/invoices/invoiceApi';
import {
  fetchInvoiceDetailsRequest,
  fetchInvoiceDetailsSuccess,
  fetchInvoiceDetailsFailure,
} from '../reducers/invoicePageSlice';
import { invoiceActions } from '../reducers/invoiceEntitySlice';

export function* fetchInvoiceDetailSaga(
  action: ReturnType<typeof fetchInvoiceDetailsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const response = (yield call(getInvoice, id)) as SagaReturnType<typeof getInvoice>;

    yield put(invoiceActions.upsertOne(response));
    yield put(fetchInvoiceDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load invoice details';
    yield put(fetchInvoiceDetailsFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
