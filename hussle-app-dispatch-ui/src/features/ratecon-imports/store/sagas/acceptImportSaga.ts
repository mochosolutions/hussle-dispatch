import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { extractErrorMessage } from 'utils/api/extractErrorMessage';
import { acceptRateconImport } from 'utils/api/ratecon-imports';
import { rateconImportEntityActions } from '../reducers/rateconImportEntitySlice';
import {
  acceptImportFailure,
  acceptImportRequest,
  acceptImportSuccess,
} from '../reducers/rateconImportPageSlice';

export function* acceptImportSaga(
  action: ReturnType<typeof acceptImportRequest>,
): Generator {
  const { importId, loadId } = action.payload;

  try {
    yield call(acceptRateconImport, importId, loadId);
    // Accepted imports leave the active inbox.
    yield put(rateconImportEntityActions.removeOne(importId));
    yield put(acceptImportSuccess({ importId }));
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to accept ratecon import');
    yield put(acceptImportFailure({ importId, error: message }));
    yield put(notify({ message, variant: 'error' }));
  }
}
