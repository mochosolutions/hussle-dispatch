import { takeLatest } from 'redux-saga/effects';
import { fetchDashboardRequest } from '../reducers/dashboardSlice';
import { fetchDashboardSaga } from './fetchDashboardSaga';

export { fetchDashboardRequest };

export function* dashboardSagaWatcher(): Generator {
  yield takeLatest(fetchDashboardRequest.type, fetchDashboardSaga);
}
