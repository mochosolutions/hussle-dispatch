import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { extractErrorMessage } from 'utils/api/extractErrorMessage';
import { rejectRateconImport } from 'utils/api/ratecon-imports';
import { rateconImportEntityActions } from '../reducers/rateconImportEntitySlice';
import {
  rejectImportFailure,
  rejectImportRequest,
  rejectImportSuccess,
} from '../reducers/rateconImportPageSlice';

export function* rejectImportSaga(
  action: ReturnType<typeof rejectImportRequest>,
): Generator {
  const { importId } = action.payload;

  try {
    yield call(rejectRateconImport, importId);
    yield put(rateconImportEntityActions.removeOne(importId));
    yield put(rejectImportSuccess({ importId }));
    yield put(notify({ message: 'Ratecon import rejected', variant: 'success' }));
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to reject ratecon import');
    yield put(rejectImportFailure({ importId, error: message }));
    yield put(notify({ message, variant: 'error' }));
  }
}
