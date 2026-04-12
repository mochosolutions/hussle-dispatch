import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import {
  approveSettlement,
  paySettlement,
  disputeSettlement,
  addAdjustment,
} from 'utils/api/accounting/settlementApi';
import {
  approveSettlementRequest,
  approveSettlementSuccess,
  approveSettlementFailure,
  paySettlementRequest,
  paySettlementSuccess,
  paySettlementFailure,
  disputeSettlementRequest,
  disputeSettlementSuccess,
  disputeSettlementFailure,
  addAdjustmentRequest,
  addAdjustmentSuccess,
  addAdjustmentFailure,
} from '../reducers/settlementPageSlice';
import { settlementActions } from '../reducers/settlementEntitySlice';

export function* approveSettlementSaga(
  action: ReturnType<typeof approveSettlementRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const response = (yield call(
      approveSettlement,
      id,
    )) as SagaReturnType<typeof approveSettlement>;

    yield put(settlementActions.upsertOne(response));
    yield put(approveSettlementSuccess({ id }));
    yield call(enqueueSnackbar, 'Settlement approved', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to approve settlement';
    yield put(approveSettlementFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}

export function* paySettlementSaga(
  action: ReturnType<typeof paySettlementRequest>,
): Generator {
  const { id, input } = action.payload;

  try {
    const response = (yield call(
      paySettlement,
      id,
      input,
    )) as SagaReturnType<typeof paySettlement>;

    yield put(settlementActions.upsertOne(response));
    yield put(paySettlementSuccess({ id }));
    yield call(enqueueSnackbar, 'Settlement marked as paid', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to mark settlement as paid';
    yield put(paySettlementFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}

export function* disputeSettlementSaga(
  action: ReturnType<typeof disputeSettlementRequest>,
): Generator {
  const { id, input } = action.payload;

  try {
    const response = (yield call(
      disputeSettlement,
      id,
      input,
    )) as SagaReturnType<typeof disputeSettlement>;

    yield put(settlementActions.upsertOne(response));
    yield put(disputeSettlementSuccess({ id }));
    yield call(enqueueSnackbar, 'Settlement disputed', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to dispute settlement';
    yield put(disputeSettlementFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}

export function* addAdjustmentSaga(
  action: ReturnType<typeof addAdjustmentRequest>,
): Generator {
  const { settlementId, input } = action.payload;

  try {
    const response = (yield call(
      addAdjustment,
      settlementId,
      input,
    )) as SagaReturnType<typeof addAdjustment>;

    yield put(settlementActions.upsertOne(response));
    yield put(addAdjustmentSuccess({ id: settlementId }));
    yield call(enqueueSnackbar, 'Adjustment added', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add adjustment';
    yield put(addAdjustmentFailure({ id: settlementId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
