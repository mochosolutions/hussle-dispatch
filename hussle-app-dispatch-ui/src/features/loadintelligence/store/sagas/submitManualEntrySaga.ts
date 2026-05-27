import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { submitManualEntry } from 'utils/api/intel/loadIntelApi';
import type { ManualEntryInput } from '../../types';
import {
  submitManualEntrySuccess,
  submitManualEntryFailure,
} from '../reducers/intelPageSlice';

export function* submitManualEntrySaga(
  action: PayloadAction<{ data: ManualEntryInput }>,
): Generator {
  try {
    const { data } = action.payload;

    const response = (yield call(submitManualEntry, data)) as SagaReturnType<
      typeof submitManualEntry
    >;

    yield put(submitManualEntrySuccess({ item: response }));
    yield put(notify({ message: 'Manual entry added', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit manual entry';
    yield put(submitManualEntryFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
