import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { getCustomerStats } from 'utils/api/fleet/customerApi';
import {
  fetchCustomerStatsRequest,
  fetchCustomerStatsSuccess,
  fetchCustomerStatsFailure,
} from '../reducers/customerPageSlice';

export function* fetchCustomerStatsSaga(
  action: ReturnType<typeof fetchCustomerStatsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const stats = (yield call(getCustomerStats, id)) as SagaReturnType<typeof getCustomerStats>;
    yield put(fetchCustomerStatsSuccess(stats));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load customer stats';
    yield put(fetchCustomerStatsFailure(errorMessage));
  }
}
