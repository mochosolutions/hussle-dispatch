import { cancel, call, delay, fork, take, takeLatest } from 'redux-saga/effects';
import type { Task } from 'redux-saga';

import {
  fetchFeedRequest,
  ingestDatRequest,
  startPolling,
  stopPolling,
} from '../reducers/loadBoardSlice';
import { fetchFeedSaga } from './fetchFeedSaga';
import { ingestDatSaga } from './ingestDatSaga';

function* pollFeedSaga(): Generator {
  while (true) {
    yield call(fetchFeedSaga);
    yield delay(10000);
  }
}

export function* loadBoardSagaWatcher(): Generator {
  yield takeLatest(fetchFeedRequest.type, fetchFeedSaga);
  yield takeLatest(ingestDatRequest.type, ingestDatSaga);

  while (true) {
    yield take(startPolling.type);
    const pollTask = (yield fork(pollFeedSaga)) as Task;
    yield take(stopPolling.type);
    yield cancel(pollTask);
  }
}
