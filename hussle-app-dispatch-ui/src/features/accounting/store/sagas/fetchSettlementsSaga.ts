import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getSettlements } from 'utils/api/accounting/settlementApi';
import {
  fetchSettlementsSuccess,
  fetchSettlementsFailure,
} from '../reducers/settlementPageSlice';
import { settlementActions } from '../reducers/settlementEntitySlice';

interface FetchSettlementsPayload {
  page?: number;
  limit?: number;
  status?: string;
  carrierId?: string;
  periodStart?: string;
  periodEnd?: string;
}

export function* fetchSettlementsSaga(action: PayloadAction<FetchSettlementsPayload>): Generator {
  try {
    const response = (yield call(
      getSettlements,
      action.payload,
    )) as SagaReturnType<typeof getSettlements>;

    yield put(settlementActions.setAll(response.data));
    yield put(
      fetchSettlementsSuccess({
        total: response.meta.total,
        page: response.meta.page,
        limit: response.meta.limit,
      }),
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load settlements';
    yield put(fetchSettlementsFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
