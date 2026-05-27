import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { disputeSettlement } from 'utils/api/accounting/settlementApi';
import {
  disputeSettlementRequest,
  disputeSettlementSuccess,
  disputeSettlementFailure,
} from '../reducers/settlementPageSlice';
import { settlementActions } from '../reducers/settlementEntitySlice';

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
    yield put(notify({ message: 'Settlement disputed', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to dispute settlement';
    yield put(disputeSettlementFailure({ id, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
