import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { approveSettlement } from 'utils/api/accounting/settlementApi';
import {
  approveSettlementRequest,
  approveSettlementSuccess,
  approveSettlementFailure,
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
