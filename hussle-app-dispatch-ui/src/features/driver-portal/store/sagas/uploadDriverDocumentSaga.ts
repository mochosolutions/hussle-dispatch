import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { confirmDocument, presignDocument } from 'utils/api/driver-portal/driverPortalApi';
import {
  uploadDriverDocumentRequest,
  uploadDriverDocumentSuccess,
  uploadDriverDocumentFailure,
  fetchDriverPortalLoadRequest,
} from '../reducers/driverPortalPageSlice';

// PUT a file to a presigned S3 URL.
const putToPresignedUrl = (url: string, file: File): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Upload failed with status ${String(xhr.status)}`));
    });
    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.send(file);
  });

// Session-based presign → PUT → confirm for a driver-portal document upload,
// then refetch so the documents checklist reflects the new server state.
export function* uploadDriverDocumentSaga(
  action: ReturnType<typeof uploadDriverDocumentRequest>,
): Generator {
  const { loadId, file, docType } = action.payload;
  try {
    const presign = (yield call(presignDocument, loadId, {
      fileName: file.name,
      mimeType: file.type,
      type: docType,
    })) as Awaited<ReturnType<typeof presignDocument>>;
    yield call(putToPresignedUrl, presign.presignedUrl, file);
    yield call(confirmDocument, loadId, presign.documentId);
    yield put(uploadDriverDocumentSuccess({ loadId, docType }));
    yield put(fetchDriverPortalLoadRequest({ loadId }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to upload document';
    yield put(uploadDriverDocumentFailure({ loadId, docType, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
