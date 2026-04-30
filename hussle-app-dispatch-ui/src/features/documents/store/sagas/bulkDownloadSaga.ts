import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { bulkDownload } from 'utils/api/documents/documentApi';
import {
  bulkDownloadSuccess,
  bulkDownloadFailure,
} from '../reducers/documentPageSlice';

interface BulkDownloadPayload {
  documentIds: string[];
}

export function* bulkDownloadSaga(
  action: PayloadAction<BulkDownloadPayload>,
): Generator {
  try {
    const result = (yield call(
      bulkDownload,
      action.payload.documentIds,
    )) as SagaReturnType<typeof bulkDownload>;

    result.downloads.forEach((download) => {
      window.open(download.presignedUrl, '_blank', 'noopener,noreferrer');
    });

    yield put(bulkDownloadSuccess());

    if (result.errors.length > 0) {
      yield put(notify({ message: `${String(result.errors.length)} document(s) could not be downloaded`, variant: 'warning' }));
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to download documents';
    yield put(bulkDownloadFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
