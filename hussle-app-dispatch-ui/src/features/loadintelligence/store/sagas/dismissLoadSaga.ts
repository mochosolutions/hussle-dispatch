import { call, put } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { dismiss } from 'utils/api/intel/loadIntelApi';
import { dismissLoadSuccess, dismissLoadFailure } from '../reducers/intelPageSlice';

export function* dismissLoadSaga(action: PayloadAction<{ id: string }>): Generator {
  const { id } = action.payload;
  try {
    yield call(dismiss, id);

    yield put(dismissLoadSuccess({ id }));
    yield call(enqueueSnackbar, 'Load dismissed', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to dismiss load';
    yield put(dismissLoadFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
