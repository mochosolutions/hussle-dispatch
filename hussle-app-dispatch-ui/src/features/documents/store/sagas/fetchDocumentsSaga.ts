import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { listDocuments } from 'utils/api/documents/documentApi';
import { documentActions } from '../reducers/documentEntitySlice';
import {
  fetchDocumentsSuccess,
  fetchDocumentsFailure,
} from '../reducers/documentPageSlice';
import type { DocumentEntityType } from '../../types';

interface FetchDocumentsPayload {
  entityType: DocumentEntityType;
  entityId: string;
}

export function* fetchDocumentsSaga(
  action: PayloadAction<FetchDocumentsPayload>,
): Generator {
  const { entityType, entityId } = action.payload;

  try {
    const response = (yield call(listDocuments, {
      entityType,
      entityId,
    })) as SagaReturnType<typeof listDocuments>;

    // Use upsertMany (not setAll) — shared store across entities
    yield put(documentActions.upsertMany(response.data));
    yield put(fetchDocumentsSuccess({ entityType, entityId }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unable to load documents';
    yield put(fetchDocumentsFailure({ entityType, entityId, error: errorMessage }));
  }
}
