import { takeLatest } from 'redux-saga/effects';
import { fetchLoadsSaga } from './fetchLoadsSaga';
import { fetchLoadDetailSaga } from './fetchLoadDetailSaga';
import { createLoadSaga } from './createLoadSaga';
import { updateLoadSaga } from './updateLoadSaga';
import { deleteLoadSaga } from './deleteLoadSaga';
import { transitionLoadStatusSaga } from './transitionLoadStatusSaga';
import { assignLoadSaga } from './assignLoadSaga';
import { assignAndDispatchSaga } from './assignAndDispatchSaga';
import { createCheckCallSaga } from './createCheckCallSaga';
import { createStopSaga } from './createStopSaga';
import { updateStopSaga } from './updateStopSaga';
import { deleteStopSaga } from './deleteStopSaga';
import { reorderStopsSaga } from './reorderStopsSaga';
import { createAccessorialSaga } from './createAccessorialSaga';
import { updateAccessorialSaga } from './updateAccessorialSaga';
import { deleteAccessorialSaga } from './deleteAccessorialSaga';
import { loadPageSlice } from '../reducers/loadPageSlice';
import {
  transitionLoadStatusRequest,
  assignLoadRequest,
  assignAndDispatchRequest,
  createCheckCallRequest,
  createStopRequest,
  updateStopRequest,
  deleteStopRequest,
  reorderStopsRequest,
  createAccessorialRequest,
  updateAccessorialRequest,
  deleteAccessorialRequest,
} from '../reducers/loadPageSlice';

export const { actions: loadPageActions } = loadPageSlice;

export function* loadSagaWatcher(): Generator {
  yield takeLatest(loadPageActions.fetchAllRequest.type, fetchLoadsSaga);
  yield takeLatest(loadPageActions.fetchByIdRequest.type, fetchLoadDetailSaga);
  yield takeLatest(loadPageActions.createRequest.type, createLoadSaga);
  yield takeLatest(loadPageActions.updateRequest.type, updateLoadSaga);
  // yield takeLatest(loadPageActions.deleteRequest.type, deleteLoadSaga);
  yield takeLatest(transitionLoadStatusRequest.type, transitionLoadStatusSaga);
  yield takeLatest(assignLoadRequest.type, assignLoadSaga);
  yield takeLatest(assignAndDispatchRequest.type, assignAndDispatchSaga);
  yield takeLatest(createCheckCallRequest.type, createCheckCallSaga);
  yield takeLatest(createStopRequest.type, createStopSaga);
  yield takeLatest(updateStopRequest.type, updateStopSaga);
  yield takeLatest(deleteStopRequest.type, deleteStopSaga);
  yield takeLatest(reorderStopsRequest.type, reorderStopsSaga);
  yield takeLatest(createAccessorialRequest.type, createAccessorialSaga);
  yield takeLatest(updateAccessorialRequest.type, updateAccessorialSaga);
  yield takeLatest(deleteAccessorialRequest.type, deleteAccessorialSaga);
}
