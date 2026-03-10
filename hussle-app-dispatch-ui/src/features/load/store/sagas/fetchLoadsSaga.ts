import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getLoads } from 'utils/api/loads/loadApi';
import {
  fetchLoadsSuccess,
  fetchLoadsFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';

interface FetchLoadsPayload {
  page?: number;
  limit?: number;
  search?: string;
  status?: string[];
  carrierId?: string;
  equipmentType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function* fetchLoadsSaga(action: PayloadAction<FetchLoadsPayload>): Generator {
  try {
    const response = (yield call(
      getLoads,
      action.payload,
    )) as SagaReturnType<typeof getLoads>;

    yield put(loadActions.setAll(response.data));
    yield put(
      fetchLoadsSuccess({
        total: response.meta.total,
        page: response.meta.page,
        limit: response.meta.limit,
      }),
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load loads';
    yield put(fetchLoadsFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
