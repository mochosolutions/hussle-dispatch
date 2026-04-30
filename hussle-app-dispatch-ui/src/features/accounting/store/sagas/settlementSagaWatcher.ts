import { takeLatest } from 'redux-saga/effects';
import { fetchSettlementsSaga } from './fetchSettlementsSaga';
import { fetchSettlementDetailSaga } from './fetchSettlementDetailSaga';
import { generateSettlementSaga } from './generateSettlementSaga';
import { approveSettlementSaga } from './approveSettlementSaga';
import { paySettlementSaga } from './paySettlementSaga';
import { disputeSettlementSaga } from './disputeSettlementSaga';
import { addAdjustmentSaga } from './addAdjustmentSaga';
import { downloadSettlementPdfSaga } from './downloadSettlementPdfSaga';
import { fetchIftaReportSaga } from './fetchIftaReportSaga';
import { fetchExpensesSaga } from './fetchExpensesSaga';
import { createExpenseSaga } from './createExpenseSaga';
import {
  settlementPageSlice,
  generateSettlementRequest,
  approveSettlementRequest,
  paySettlementRequest,
  disputeSettlementRequest,
  addAdjustmentRequest,
  downloadSettlementPdfRequest,
} from '../reducers/settlementPageSlice';
import { fetchIftaReportRequest } from '../reducers/iftaPageSlice';
import {
  fetchExpensesRequest,
  createExpenseRequest,
} from '../reducers/expensePageSlice';

const { actions: settlementPageActions } = settlementPageSlice;

export function* settlementSagaWatcher(): Generator {
  yield takeLatest(settlementPageActions.fetchAllRequest.type, fetchSettlementsSaga);
  yield takeLatest(settlementPageActions.fetchByIdRequest.type, fetchSettlementDetailSaga);
  yield takeLatest(generateSettlementRequest.type, generateSettlementSaga);
  yield takeLatest(approveSettlementRequest.type, approveSettlementSaga);
  yield takeLatest(paySettlementRequest.type, paySettlementSaga);
  yield takeLatest(disputeSettlementRequest.type, disputeSettlementSaga);
  yield takeLatest(addAdjustmentRequest.type, addAdjustmentSaga);
  yield takeLatest(downloadSettlementPdfRequest.type, downloadSettlementPdfSaga);
  yield takeLatest(fetchIftaReportRequest.type, fetchIftaReportSaga);
  yield takeLatest(fetchExpensesRequest.type, fetchExpensesSaga);
  yield takeLatest(createExpenseRequest.type, createExpenseSaga);
}
