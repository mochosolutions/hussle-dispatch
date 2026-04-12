import { call, put } from 'redux-saga/effects';
import type { SagaReturnType } from 'redux-saga/effects';

import { getLoadBoardFeed } from 'utils/api/loadBoard/loadBoardApi';

import { fetchFeedFailure, fetchFeedSuccess } from '../reducers/loadBoardSlice';

export function* fetchFeedSaga(): Generator {
  try {
    const response = (yield call(getLoadBoardFeed)) as SagaReturnType<typeof getLoadBoardFeed>;
    yield put(fetchFeedSuccess({ loads: response.data, meta: response.meta }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch load board feed';
    yield put(fetchFeedFailure(message));
  }
}
