import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
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
    yield call(enqueueSnackbar, 'Manual entry added', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit manual entry';
    yield put(submitManualEntryFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
