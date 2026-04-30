import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
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
    yield put(notify({ message: 'Settlement approved', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to approve settlement';
    yield put(approveSettlementFailure({ id, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
