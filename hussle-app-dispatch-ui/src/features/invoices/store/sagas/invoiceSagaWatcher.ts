import { takeLatest } from 'redux-saga/effects';
import { fetchInvoicesSaga } from './fetchInvoicesSaga';
import { fetchInvoiceDetailSaga } from './fetchInvoiceDetailSaga';
import { approveInvoiceSaga } from './approveInvoiceSaga';
import { sendInvoiceSaga } from './sendInvoiceSaga';
import { markPaidSaga } from './markPaidSaga';
import { deleteInvoiceSaga } from './deleteInvoiceSaga';
import {
  invoicePageSlice,
  approveInvoiceRequest,
  sendInvoiceRequest,
  markPaidRequest,
} from '../reducers/invoicePageSlice';

const { actions: invoicePageActions } = invoicePageSlice;

export function* invoiceSagaWatcher(): Generator {
  yield takeLatest(invoicePageActions.fetchAllRequest.type, fetchInvoicesSaga);
  yield takeLatest(invoicePageActions.fetchByIdRequest.type, fetchInvoiceDetailSaga);
  yield takeLatest(invoicePageActions.deleteRequest.type, deleteInvoiceSaga);
  yield takeLatest(approveInvoiceRequest.type, approveInvoiceSaga);
  yield takeLatest(sendInvoiceRequest.type, sendInvoiceSaga);
  yield takeLatest(markPaidRequest.type, markPaidSaga);
}
