import { call, put, select, takeLatest } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from 'store';
import type { Session } from 'features/carrier-portal/engine';
import { DocumentType } from 'features/documents/types';
import {
  uploadFileViaPresign,
  type ConfirmFnInput,
  type NormalizedPresign,
  type PresignFnInput,
  type UploadFileViaPresignDeps,
} from 'features/documents/store/sagas/uploadFileViaPresign';
import {
  confirmDocumentV2,
  presignDocumentV2,
  uploadToPresignedUrl,
} from 'utils/api/carrierPortal/v2';

import { carrierPortalV2Actions } from '../reducers/carrierPortalSlice';
import { selectToken } from '../selectors/carrierPortalSelectors';
import { extractErrorMessage } from './sessionAdapters';

interface UploadDocumentPayload {
  documentType: string;
  file: File;
  expiresAt?: string;
  metadata?: Record<string, string>;
}

const isDocumentType = (value: string): value is DocumentType =>
  (Object.values(DocumentType) as string[]).includes(value);

// ---------------------------------------------------------------------------
// Worker — delegates the presign → PUT → confirm orchestration to the shared
// `uploadFileViaPresign` helper. Token + carrier session guards stay here.
// ---------------------------------------------------------------------------

function* handleUploadDocument(action: PayloadAction<UploadDocumentPayload>): Generator {
  try {
    const token: string | null = yield select(selectToken);
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

    const { file, documentType, expiresAt, metadata } = action.payload;
    if (!isDocumentType(documentType)) {
      const message = `Unknown document type: ${documentType}`;
      yield put(carrierPortalV2Actions.uploadDocumentFailure(message));
      yield call(enqueueSnackbar, message, { variant: 'error' });
      return;
    }

    const presignFn = async (input: PresignFnInput): Promise<NormalizedPresign> => {
      const presign = await presignDocumentV2(token, {
        fileName: input.fileName,
        mimeType: input.mimeType,
        type: input.type,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
        ...(input.metadata ? { metadata: input.metadata } : {}),
      });
      const documentId = presign.documentId ?? presign.id;
      if (!documentId) {
        throw new Error('Presign response missing document id');
      }
      return { documentId, presignedUrl: presign.uploadUrl };
    };

    const confirmFn = async (
      documentId: string,
      confirmInput?: ConfirmFnInput,
    ): Promise<unknown> => confirmDocumentV2(token, documentId, confirmInput);

    const deps: UploadFileViaPresignDeps<unknown> = {
      presignFn,
      confirmFn,
      uploadFn: uploadToPresignedUrl,
    };

    yield call(
      uploadFileViaPresign,
      { file, documentType, entityType: 'carrier', entityId: carrierId, expiresAt, metadata },
      deps,
    );

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
