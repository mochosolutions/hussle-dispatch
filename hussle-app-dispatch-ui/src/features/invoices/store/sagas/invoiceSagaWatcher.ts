import { takeLatest } from 'redux-saga/effects';
import { fetchInvoicesSaga } from './fetchInvoicesSaga';
import { fetchInvoiceDetailSaga } from './fetchInvoiceDetailSaga';
import { approveInvoiceSaga } from './approveInvoiceSaga';
import { sendInvoiceSaga } from './sendInvoiceSaga';
import { markPaidSaga } from './markPaidSaga';
import { deleteInvoiceSaga } from './deleteInvoiceSaga';
import { createFromLoadSaga } from './createFromLoadSaga';
import { voidInvoiceSaga } from './voidInvoiceSaga';
import { downloadPacketSaga } from './downloadPacketSaga';
import { previewPdfSaga } from './previewPdfSaga';
import { fetchCountsSaga } from './fetchCountsSaga';
import {
  invoicePageSlice,
  approveInvoiceRequest,
  sendInvoiceRequest,
  markPaidRequest,
  createFromLoadRequest,
  voidInvoiceRequest,
  downloadPacketRequest,
  previewPdfRequest,
  fetchCountsRequest,
} from '../reducers/invoicePageSlice';

const { actions: invoicePageActions } = invoicePageSlice;

export function* invoiceSagaWatcher(): Generator {
  yield takeLatest(invoicePageActions.fetchAllRequest.type, fetchInvoicesSaga);
  yield takeLatest(invoicePageActions.fetchByIdRequest.type, fetchInvoiceDetailSaga);
  yield takeLatest(invoicePageActions.deleteRequest.type, deleteInvoiceSaga);
  yield takeLatest(approveInvoiceRequest.type, approveInvoiceSaga);
  yield takeLatest(sendInvoiceRequest.type, sendInvoiceSaga);
  yield takeLatest(markPaidRequest.type, markPaidSaga);
  yield takeLatest(createFromLoadRequest.type, createFromLoadSaga);
  yield takeLatest(voidInvoiceRequest.type, voidInvoiceSaga);
  yield takeLatest(downloadPacketRequest.type, downloadPacketSaga);
  yield takeLatest(previewPdfRequest.type, previewPdfSaga);
  yield takeLatest(fetchCountsRequest.type, fetchCountsSaga);
}
