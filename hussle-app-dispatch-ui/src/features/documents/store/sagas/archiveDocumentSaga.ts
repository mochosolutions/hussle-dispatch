import { call, put } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { archiveDocument } from 'utils/api/documents/documentApi';
import { documentActions } from '../reducers/documentEntitySlice';
import {
  archiveDocumentSuccess,
  archiveDocumentFailure,
} from '../reducers/documentPageSlice';

interface ArchiveDocumentPayload {
  documentId: string;
}

export function* archiveDocumentSaga(
  action: PayloadAction<ArchiveDocumentPayload>,
): Generator {
  const { documentId } = action.payload;
  try {
    yield call(archiveDocument, documentId);
    yield put(documentActions.removeOne(documentId));
    yield put(archiveDocumentSuccess({ documentId }));
    yield call(enqueueSnackbar, 'Document deleted', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete document';
    yield put(archiveDocumentFailure({ documentId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
