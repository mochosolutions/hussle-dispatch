import { takeLatest } from 'redux-saga/effects';
import {
  fetchDriverPortalLoadRequest,
  fetchDriverPortalLoadsRequest,
  updateDriverStatusRequest,
  uploadDriverDocumentRequest,
  acceptDriverInviteRequest,
} from '../reducers/driverPortalPageSlice';
import { fetchDriverPortalLoadSaga } from './fetchDriverPortalLoadSaga';
import { fetchDriverPortalLoadsSaga } from './fetchDriverPortalLoadsSaga';
import { updateDriverStatusSaga } from './updateDriverStatusSaga';
import { uploadDriverDocumentSaga } from './uploadDriverDocumentSaga';
import { acceptDriverInviteSaga } from './acceptDriverInviteSaga';

export function* driverPortalSagaWatcher() {
  yield takeLatest(fetchDriverPortalLoadRequest.type, fetchDriverPortalLoadSaga);
  yield takeLatest(fetchDriverPortalLoadsRequest.type, fetchDriverPortalLoadsSaga);
  yield takeLatest(updateDriverStatusRequest.type, updateDriverStatusSaga);
  yield takeLatest(uploadDriverDocumentRequest.type, uploadDriverDocumentSaga);
  yield takeLatest(acceptDriverInviteRequest.type, acceptDriverInviteSaga);
}
