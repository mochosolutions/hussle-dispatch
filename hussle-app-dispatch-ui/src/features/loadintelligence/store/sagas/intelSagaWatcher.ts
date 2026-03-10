import { takeLatest } from 'redux-saga/effects';
import {
  fetchFeedRequest,
  fetchChainsRequest,
  dismissLoadRequest,
  bookLoadRequest,
  bookChainRequest,
  submitManualEntryRequest,
  setFilters,
  setSortBy,
} from '../reducers/intelPageSlice';
import { fetchFeedSaga } from './fetchFeedSaga';
import { fetchChainsSaga } from './fetchChainsSaga';
import { dismissLoadSaga } from './dismissLoadSaga';
import { bookLoadSaga } from './bookLoadSaga';
import { bookChainSaga } from './bookChainSaga';
import { submitManualEntrySaga } from './submitManualEntrySaga';

export function* intelSagaWatcher(): Generator {
  yield takeLatest(fetchFeedRequest.type, fetchFeedSaga);
  yield takeLatest(fetchChainsRequest.type, fetchChainsSaga);
  yield takeLatest(dismissLoadRequest.type, dismissLoadSaga);
  yield takeLatest(bookLoadRequest.type, bookLoadSaga);
  yield takeLatest(bookChainRequest.type, bookChainSaga);
  yield takeLatest(submitManualEntryRequest.type, submitManualEntrySaga);
  // Re-fetch feed when filters or sort change
  yield takeLatest(setFilters.type, fetchFeedSaga);
  yield takeLatest(setSortBy.type, fetchFeedSaga);
}
