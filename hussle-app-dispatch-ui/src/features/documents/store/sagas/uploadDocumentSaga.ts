import { call, put } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';

import { notify } from 'features/ui/store/reducers/notificationSlice';
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
import type { Document, DocumentEntityType, DocumentType } from '../../types';
import {
  uploadFileViaPresign,
  type ConfirmFnInput,
  type NormalizedPresign,
  type PresignFnInput,
  type UploadFileViaPresignDeps,
} from './uploadFileViaPresign';

interface UploadDocumentPayload {
  file: File;
  documentType: DocumentType;
  entityType: DocumentEntityType;
  entityId: string;
  clientId: string;
  expiresAt?: string;
  metadata?: Record<string, string>;
}

// Adapters bridge the dispatcher API client (presign returns `{ presign }`,
// confirm returns `{ document }`) to the helper's normalized shapes.
const presignFn = async (input: PresignFnInput): Promise<NormalizedPresign> => {
  const result = await presignDocument(input);
  return {
    documentId: result.presign.documentId,
    presignedUrl: result.presign.presignedUrl,
  };
};

const confirmFn = async (
  documentId: string,
  confirmInput?: ConfirmFnInput,
): Promise<Document> => {
  const result = await confirmDocument(documentId, confirmInput);
  return result.document;
};

const deps: UploadFileViaPresignDeps<Document> = {
  presignFn,
  confirmFn,
  uploadFn: uploadDocumentToS3,
};

export function* uploadDocumentSaga(
  action: PayloadAction<UploadDocumentPayload>,
): Generator {
  const { file, documentType, entityType, entityId, clientId, expiresAt, metadata } =
    action.payload;

  try {
    const result = (yield call(
      uploadFileViaPresign<Document>,
      { file, documentType, entityType, entityId, expiresAt, metadata },
      deps,
    )) as { documentId: string; confirmResult: Document };

    yield put(documentActions.addOne(result.confirmResult));
    yield put(uploadDocumentSuccess({ clientId }));
    yield put(notify({ message: 'Document uploaded', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to upload document';
    yield put(uploadDocumentFailure({ clientId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
