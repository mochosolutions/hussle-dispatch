import { takeLatest } from 'redux-saga/effects';
import { fetchSettlementsSaga } from './fetchSettlementsSaga';
import { fetchSettlementDetailSaga } from './fetchSettlementDetailSaga';
import { generateSettlementSaga } from './generateSettlementSaga';
import {
  approveSettlementSaga,
  paySettlementSaga,
  disputeSettlementSaga,
  addAdjustmentSaga,
} from './settlementActionSagas';
import {
  settlementPageSlice,
  generateSettlementRequest,
  approveSettlementRequest,
  paySettlementRequest,
  disputeSettlementRequest,
  addAdjustmentRequest,
} from '../reducers/settlementPageSlice';

const { actions: settlementPageActions } = settlementPageSlice;

export function* settlementSagaWatcher(): Generator {
  yield takeLatest(settlementPageActions.fetchAllRequest.type, fetchSettlementsSaga);
  yield takeLatest(settlementPageActions.fetchByIdRequest.type, fetchSettlementDetailSaga);
  yield takeLatest(generateSettlementRequest.type, generateSettlementSaga);
  yield takeLatest(approveSettlementRequest.type, approveSettlementSaga);
  yield takeLatest(paySettlementRequest.type, paySettlementSaga);
  yield takeLatest(disputeSettlementRequest.type, disputeSettlementSaga);
  yield takeLatest(addAdjustmentRequest.type, addAdjustmentSaga);
}
