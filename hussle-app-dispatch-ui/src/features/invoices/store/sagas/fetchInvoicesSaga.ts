import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getInvoices } from 'utils/api/invoices/invoiceApi';
import {
  fetchInvoicesSuccess,
  fetchInvoicesFailure,
} from '../reducers/invoicePageSlice';
import { invoiceActions } from '../reducers/invoiceEntitySlice';
import type { InvoiceFilters } from '../../types';

export function* fetchInvoicesSaga(action: PayloadAction<InvoiceFilters>): Generator {
  try {
    const response = (yield call(
      getInvoices,
      action.payload,
    )) as SagaReturnType<typeof getInvoices>;

    yield put(invoiceActions.setAll(response.data));
    yield put(
      fetchInvoicesSuccess({
        total: response.meta.total,
        page: response.meta.page,
        limit: response.meta.limit,
      }),
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load invoices';
    yield put(fetchInvoicesFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
