import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import {
  confirmDocumentV2,
  presignDocumentV2,
  uploadToPresignedUrl,
} from 'utils/api/carrierPortal/v2';
import type { PresignResponseV2 } from 'utils/api/carrierPortal/v2';

import { carrierPortalV2Actions } from '../reducers/carrierPortalSlice';
import { extractErrorMessage } from './sessionAdapters';

interface UploadDocumentPayload {
  documentType: string;
  file: File;
}

// ---------------------------------------------------------------------------
// Worker — 3-step flow: presign → PUT → confirm.
// ---------------------------------------------------------------------------

function* handleUploadDocument(action: PayloadAction<UploadDocumentPayload>): Generator {
  try {
    const token: string | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.token,
    );
    if (!token) {
      yield put(carrierPortalV2Actions.uploadDocumentFailure('No token available'));
      return;
    }

    const { file, documentType } = action.payload;

    const presign: PresignResponseV2 = yield call(presignDocumentV2, token, {
      filename: file.name,
      contentType: file.type,
      documentType,
    });

    yield call(uploadToPresignedUrl, presign.uploadUrl, file);

    const documentId = presign.documentId ?? presign.id;
    if (!documentId) {
      throw new Error('Presign response missing document id');
    }

    yield call(confirmDocumentV2, token, documentId, { key: presign.key });

    yield put(carrierPortalV2Actions.uploadDocumentSuccess({ documentType }));
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to upload document');
    yield put(carrierPortalV2Actions.uploadDocumentFailure(message));
    yield call(enqueueSnackbar, message, { variant: 'error' });
  }
}

// ---------------------------------------------------------------------------
// Watcher
// ---------------------------------------------------------------------------

export function* uploadDocumentSaga(): Generator {
  yield takeLatest(carrierPortalV2Actions.uploadDocument.type, handleUploadDocument);
}
