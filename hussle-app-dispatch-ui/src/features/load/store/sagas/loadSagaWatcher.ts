import { takeLatest } from 'redux-saga/effects';
import { fetchLoadsSaga } from './fetchLoadsSaga';
import { fetchLoadDetailSaga } from './fetchLoadDetailSaga';
import { createLoadSaga } from './createLoadSaga';
import { updateLoadSaga } from './updateLoadSaga';
import { transitionLoadStatusSaga } from './transitionLoadStatusSaga';
import { createCheckCallSaga } from './createCheckCallSaga';
import { loadPageSlice } from '../reducers/loadPageSlice';
import {
  transitionLoadStatusRequest,
  createCheckCallRequest,
} from '../reducers/loadPageSlice';

export const { actions: loadPageActions } = loadPageSlice;

export function* loadSagaWatcher(): Generator {
  yield takeLatest(loadPageActions.fetchAllRequest.type, fetchLoadsSaga);
  yield takeLatest(loadPageActions.fetchByIdRequest.type, fetchLoadDetailSaga);
  yield takeLatest(loadPageActions.createRequest.type, createLoadSaga);
  yield takeLatest(loadPageActions.updateRequest.type, updateLoadSaga);
  yield takeLatest(transitionLoadStatusRequest.type, transitionLoadStatusSaga);
  yield takeLatest(createCheckCallRequest.type, createCheckCallSaga);
}
