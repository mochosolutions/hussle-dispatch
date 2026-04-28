import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getDocumentDownloadUrl } from 'utils/api/documents/documentApi';
import {
  getDownloadUrlSuccess,
  getDownloadUrlFailure,
} from '../reducers/documentPageSlice';

interface GetDownloadUrlPayload {
  documentId: string;
}

export function* getDownloadUrlSaga(
  action: PayloadAction<GetDownloadUrlPayload>,
): Generator {
  const { documentId } = action.payload;
  try {
    const result = (yield call(
      getDocumentDownloadUrl,
      documentId,
    )) as SagaReturnType<typeof getDocumentDownloadUrl>;
    yield put(getDownloadUrlSuccess({ documentId, url: result.url }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get download URL';
    yield put(getDownloadUrlFailure({ documentId, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
