import { call, put } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
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
    yield put(notify({ message: 'Document deleted', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete document';
    yield put(archiveDocumentFailure({ documentId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
