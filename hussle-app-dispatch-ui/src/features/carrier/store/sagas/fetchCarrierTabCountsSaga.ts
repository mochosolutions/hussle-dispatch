import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { getCarrierTabCounts } from 'utils/api/fleet/carrierApi';
import {
  fetchCarrierTabCountsFailure,
  fetchCarrierTabCountsSuccess,
} from '../reducers/carrierNewPageSlice';

export function* fetchCarrierTabCountsSaga(): Generator {
  try {
    const counts = (yield call(getCarrierTabCounts)) as SagaReturnType<typeof getCarrierTabCounts>;
    yield put(fetchCarrierTabCountsSuccess(counts));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load carrier tab counts';
    yield put(fetchCarrierTabCountsFailure(errorMessage));
  }
}
