import { call, put, all } from 'redux-saga/effects';
import type { SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getKpis, getWeeklyGross, getAttentionItems } from 'utils/api/dashboard/dashboardApi';
import {
  fetchKpisRequest,
  fetchKpisSuccess,
  fetchKpisFailure,
  fetchWeeklyGrossRequest,
  fetchWeeklyGrossSuccess,
  fetchWeeklyGrossFailure,
  fetchAttentionItemsRequest,
  fetchAttentionItemsSuccess,
  fetchAttentionItemsFailure,
} from '../reducers/dashboardSlice';

// ---------------------------------------------------------------------------
// Individual fetch generators
// ---------------------------------------------------------------------------

function* fetchKpisSaga(): Generator {
  try {
    yield put(fetchKpisRequest());
    const response = (yield call(getKpis)) as SagaReturnType<typeof getKpis>;
    yield put(fetchKpisSuccess(response));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load KPIs';
    yield put(fetchKpisFailure({ error: errorMessage }));
  }
}

function* fetchWeeklyGrossSaga(): Generator {
  try {
    yield put(fetchWeeklyGrossRequest());
    const response = (yield call(getWeeklyGross)) as SagaReturnType<typeof getWeeklyGross>;
    yield put(fetchWeeklyGrossSuccess(response ?? []));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load weekly gross';
    yield put(fetchWeeklyGrossFailure({ error: errorMessage }));
  }
}

function* fetchAttentionItemsSaga(): Generator {
  try {
    yield put(fetchAttentionItemsRequest());
    const response = (yield call(getAttentionItems)) as SagaReturnType<typeof getAttentionItems>;
    yield put(fetchAttentionItemsSuccess(response ?? []));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load attention items';
    yield put(fetchAttentionItemsFailure({ error: errorMessage }));
  }
}

// ---------------------------------------------------------------------------
// Combined fetch — dispatched once on dashboard mount
// ---------------------------------------------------------------------------

export function* fetchDashboardSaga(): Generator {
  try {
    yield all([fetchKpisSaga(), fetchWeeklyGrossSaga(), fetchAttentionItemsSaga()]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard';
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
