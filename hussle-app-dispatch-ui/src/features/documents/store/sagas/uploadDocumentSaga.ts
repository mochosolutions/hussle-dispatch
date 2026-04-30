import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import {
  presignDocument,
  uploadDocumentToS3,
  confirmDocument,
} from 'utils/api/documents/documentApi';
import { documentActions } from '../reducers/documentEntitySlice';
import {
  uploadDocumentSuccess,
  uploadDocumentFailure,
} from '../reducers/documentPageSlice';
import type { DocumentEntityType, DocumentType } from '../../types';

interface UploadDocumentPayload {
  file: File;
  documentType: DocumentType;
  entityType: DocumentEntityType;
  entityId: string;
  clientId: string;
  expiresAt?: string;
  metadata?: Record<string, string>;
}

export function* uploadDocumentSaga(
  action: PayloadAction<UploadDocumentPayload>,
): Generator {
  const { file, documentType, entityType, entityId, clientId, expiresAt, metadata } =
    action.payload;

  try {
    // 1. Get presigned URL. fileSize is sent as a UX hint — the backend
    // re-validates against S3's authoritative size during confirm.
    const presignResult = (yield call(presignDocument, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      type: documentType,
      entityType,
      entityId,
      ...(expiresAt ? { expiresAt } : {}),
      ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
    })) as SagaReturnType<typeof presignDocument>;

    // 2. Upload file to S3
    yield call(uploadDocumentToS3, presignResult.presign.presignedUrl, file);

    // 3. Confirm upload
    const confirmInput =
      expiresAt || (metadata && Object.keys(metadata).length > 0)
        ? { ...(expiresAt ? { expiresAt } : {}), ...(metadata ? { metadata } : {}) }
        : undefined;

    const confirmResult = (yield call(
      confirmDocument,
      presignResult.presign.documentId,
      confirmInput,
    )) as SagaReturnType<typeof confirmDocument>;

    // 4. Add to entity store
    yield put(documentActions.addOne(confirmResult.document));

    // 5. Update page state
    yield put(uploadDocumentSuccess({ clientId }));

    yield call(enqueueSnackbar, 'Document uploaded', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to upload document';
    yield put(uploadDocumentFailure({ clientId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
