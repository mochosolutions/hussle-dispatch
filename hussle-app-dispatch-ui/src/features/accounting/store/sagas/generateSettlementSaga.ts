import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { generateSettlement } from 'utils/api/accounting/settlementApi';
import {
  generateSettlementRequest,
  generateSettlementSuccess,
  generateSettlementFailure,
} from '../reducers/settlementPageSlice';
import { settlementActions } from '../reducers/settlementEntitySlice';

export function* generateSettlementSaga(
  action: ReturnType<typeof generateSettlementRequest>,
): Generator {
  try {
    const settlement = (yield call(
      generateSettlement,
      action.payload,
    )) as SagaReturnType<typeof generateSettlement>;

    yield put(settlementActions.addOne(settlement));
    yield put(generateSettlementSuccess({ id: settlement.id }));
    yield call(enqueueSnackbar, 'Settlement generated', { variant: 'success' });

    const navigate = (yield call(getNavigate)) as (path: string) => void;
    yield call(navigate, `/accounting/settlements/${settlement.id}`);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to generate settlement';
    yield put(generateSettlementFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
