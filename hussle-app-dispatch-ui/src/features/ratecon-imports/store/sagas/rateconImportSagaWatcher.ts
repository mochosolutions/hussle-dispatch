import { cancel, call, delay, fork, take, takeLatest } from 'redux-saga/effects';
import type { Task } from 'redux-saga';

import {
  acceptImportRequest,
  fetchImportsRequest,
  manualUploadRequest,
  rejectImportRequest,
  retryImportRequest,
  reviewImportRequest,
  startRateconPolling,
  stopRateconPolling,
} from '../reducers/rateconImportPageSlice';
import { acceptImportSaga } from './acceptImportSaga';
import { fetchImportsSaga } from './fetchImportsSaga';
import { manualUploadSaga } from './manualUploadSaga';
import { rejectImportSaga } from './rejectImportSaga';
import { retryImportSaga } from './retryImportSaga';
import { reviewImportSaga } from './reviewImportSaga';

function* pollImportsSaga(): Generator {
  while (true) {
    yield call(fetchImportsSaga);
    yield delay(10000);
  }
}

export function* rateconImportSagaWatcher(): Generator {
  yield takeLatest(fetchImportsRequest.type, fetchImportsSaga);
  yield takeLatest(acceptImportRequest.type, acceptImportSaga);
  yield takeLatest(rejectImportRequest.type, rejectImportSaga);
  yield takeLatest(retryImportRequest.type, retryImportSaga);
  yield takeLatest(reviewImportRequest.type, reviewImportSaga);
  yield takeLatest(manualUploadRequest.type, manualUploadSaga);

  while (true) {
    yield take(startRateconPolling.type);
    const pollTask = (yield fork(pollImportsSaga)) as Task;
    yield take(stopRateconPolling.type);
    yield cancel(pollTask);
  }
}
