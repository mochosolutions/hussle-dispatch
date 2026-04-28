import { takeLatest, takeEvery } from 'redux-saga/effects';
import {
  fetchDocumentsRequest,
  uploadDocumentRequest,
  bulkDownloadRequest,
  archiveDocumentRequest,
  getDownloadUrlRequest,
} from '../reducers/documentPageSlice';
import { fetchDocumentsSaga } from './fetchDocumentsSaga';
import { uploadDocumentSaga } from './uploadDocumentSaga';
import { bulkDownloadSaga } from './bulkDownloadSaga';
import { archiveDocumentSaga } from './archiveDocumentSaga';
import { getDownloadUrlSaga } from './getDownloadUrlSaga';

export function* documentSagaWatcher(): Generator {
  yield takeLatest(fetchDocumentsRequest.type, fetchDocumentsSaga);
  yield takeEvery(uploadDocumentRequest.type, uploadDocumentSaga);
  yield takeLatest(bulkDownloadRequest.type, bulkDownloadSaga);
  yield takeEvery(archiveDocumentRequest.type, archiveDocumentSaga);
  yield takeEvery(getDownloadUrlRequest.type, getDownloadUrlSaga);
}
