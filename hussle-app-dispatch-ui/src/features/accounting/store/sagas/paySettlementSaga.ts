import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { paySettlement } from 'utils/api/accounting/settlementApi';
import {
  paySettlementRequest,
  paySettlementSuccess,
  paySettlementFailure,
} from '../reducers/settlementPageSlice';
import { settlementActions } from '../reducers/settlementEntitySlice';

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
    yield put(notify({ message: 'Settlement marked as paid', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to mark settlement as paid';
    yield put(paySettlementFailure({ id, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
