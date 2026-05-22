import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import type { Session } from 'features/carrier-portal/engine';
import { DocumentType } from 'features/documents/types';
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

const isDocumentType = (value: string): value is DocumentType =>
  (Object.values(DocumentType) as string[]).includes(value);

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

    const session: Session | null = yield select(
      (state: RootState) => state.pages.carrierPortalV2.session,
    );
    const carrierId = session?.carrierId ?? null;
    if (!carrierId) {
      const message = 'Cannot upload document: carrier session not loaded';
      yield put(carrierPortalV2Actions.uploadDocumentFailure(message));
      yield call(enqueueSnackbar, message, { variant: 'error' });
      return;
    }

    const { file, documentType } = action.payload;
    if (!isDocumentType(documentType)) {
      const message = `Unknown document type: ${documentType}`;
      yield put(carrierPortalV2Actions.uploadDocumentFailure(message));
      yield call(enqueueSnackbar, message, { variant: 'error' });
      return;
    }

    const presign: PresignResponseV2 = yield call(presignDocumentV2, token, {
      fileName: file.name,
      mimeType: file.type,
      type: documentType,
      entityType: 'carrier',
      entityId: carrierId,
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
