import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getSettlement } from 'utils/api/accounting/settlementApi';
import {
  fetchSettlementDetailRequest,
  fetchSettlementDetailSuccess,
  fetchSettlementDetailFailure,
} from '../reducers/settlementPageSlice';
import { settlementActions } from '../reducers/settlementEntitySlice';

export function* fetchSettlementDetailSaga(
  action: ReturnType<typeof fetchSettlementDetailRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const response = (yield call(getSettlement, id)) as SagaReturnType<typeof getSettlement>;

    yield put(settlementActions.upsertOne(response));
    yield put(fetchSettlementDetailSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load settlement details';
    yield put(fetchSettlementDetailFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
