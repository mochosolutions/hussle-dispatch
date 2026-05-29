import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { extractErrorMessage } from 'utils/api/extractErrorMessage';
import { retryRateconImport } from 'utils/api/ratecon-imports';
import type { RateconImport } from 'utils/api/ratecon-imports';
import { rateconImportEntityActions } from '../reducers/rateconImportEntitySlice';
import {
  retryImportFailure,
  retryImportRequest,
  retryImportSuccess,
} from '../reducers/rateconImportPageSlice';

export function* retryImportSaga(
  action: ReturnType<typeof retryImportRequest>,
): Generator {
  const { importId } = action.payload;

  try {
    const updated = (yield call(retryRateconImport, importId)) as RateconImport;
    yield put(rateconImportEntityActions.upsertOne(updated));
    yield put(retryImportSuccess({ importId, import: updated }));
    yield put(notify({ message: 'Re-running extraction…', variant: 'info' }));
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to retry ratecon import');
    yield put(retryImportFailure({ importId, error: message }));
    yield put(notify({ message, variant: 'error' }));
  }
}
