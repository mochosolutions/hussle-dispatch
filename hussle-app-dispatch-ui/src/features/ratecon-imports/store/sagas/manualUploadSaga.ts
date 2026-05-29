import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { extractErrorMessage } from 'utils/api/extractErrorMessage';
import { manualUploadRateconImport } from 'utils/api/ratecon-imports';
import type { RateconImport } from 'utils/api/ratecon-imports';
import { rateconImportEntityActions } from '../reducers/rateconImportEntitySlice';
import {
  manualUploadFailure,
  manualUploadRequest,
  manualUploadSuccess,
} from '../reducers/rateconImportPageSlice';

export function* manualUploadSaga(
  action: ReturnType<typeof manualUploadRequest>,
): Generator {
  const { file } = action.payload;

  try {
    const created = (yield call(manualUploadRateconImport, file)) as RateconImport;
    yield put(rateconImportEntityActions.upsertOne(created));
    yield put(manualUploadSuccess({ import: created }));
    yield put(notify({ message: 'Upload received — extracting…', variant: 'success' }));
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to upload rate confirmation');
    yield put(manualUploadFailure({ error: message }));
    yield put(notify({ message, variant: 'error' }));
  }
}
