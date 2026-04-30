import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { getPlaceStats } from 'utils/api/places/placeApi';
import {
  fetchPlaceStatsRequest,
  fetchPlaceStatsSuccess,
  fetchPlaceStatsFailure,
} from '../reducers/placePageSlice';

export function* fetchPlaceStatsSaga(
  action: ReturnType<typeof fetchPlaceStatsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const stats = (yield call(getPlaceStats, id)) as SagaReturnType<typeof getPlaceStats>;
    yield put(fetchPlaceStatsSuccess(stats));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load place stats';
    yield put(fetchPlaceStatsFailure(errorMessage));
  }
}
