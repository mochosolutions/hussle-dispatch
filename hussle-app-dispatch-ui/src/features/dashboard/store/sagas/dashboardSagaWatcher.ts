import { takeLatest } from 'redux-saga/effects';
import { createAction } from '@reduxjs/toolkit';
import { fetchDashboardSaga } from './fetchDashboardSaga';

// Action dispatched by the DashboardPage on mount
export const fetchDashboardRequest = createAction('dashboard/fetchDashboardRequest');

export function* dashboardSagaWatcher(): Generator {
  yield takeLatest(fetchDashboardRequest.type, fetchDashboardSaga);
}
