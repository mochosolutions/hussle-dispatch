import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { getCarrierStats } from 'utils/api/fleet/carrierApi';
import {
  fetchCarrierStatsRequest,
  fetchCarrierStatsSuccess,
  fetchCarrierStatsFailure,
} from '../reducers/carrierNewPageSlice';

export function* fetchCarrierStatsSaga(
  action: ReturnType<typeof fetchCarrierStatsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const stats = (yield call(getCarrierStats, id)) as SagaReturnType<typeof getCarrierStats>;
    yield put(fetchCarrierStatsSuccess(stats));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load carrier stats';
    yield put(fetchCarrierStatsFailure(errorMessage));
  }
}
