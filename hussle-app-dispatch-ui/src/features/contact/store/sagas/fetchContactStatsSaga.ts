import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { getContactStats } from 'utils/api/fleet/contactApi';
import {
  fetchContactStatsRequest,
  fetchContactStatsSuccess,
  fetchContactStatsFailure,
} from '../reducers/contactPageSlice';

export function* fetchContactStatsSaga(
  action: ReturnType<typeof fetchContactStatsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const stats = (yield call(getContactStats, id)) as SagaReturnType<typeof getContactStats>;
    yield put(fetchContactStatsSuccess(stats));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load contact stats';
    yield put(fetchContactStatsFailure(errorMessage));
  }
}
