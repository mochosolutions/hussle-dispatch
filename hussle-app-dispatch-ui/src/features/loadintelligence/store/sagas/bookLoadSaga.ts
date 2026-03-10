import { call, put } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { bookLoad } from 'utils/api/intel/loadIntelApi';
import type { BookLoadResult } from '../../types';
import { bookLoadSuccess, bookLoadFailure } from '../reducers/intelPageSlice';

export function* bookLoadSaga(action: PayloadAction<{ id: string }>): Generator {
  const { id } = action.payload;
  try {
    const result = (yield call(bookLoad, id)) as BookLoadResult;

    yield put(bookLoadSuccess(result));

    yield call(enqueueSnackbar, 'Load booked - creating load', { variant: 'success' });

    const navigate = (yield call(getNavigate)) as (
      path: string,
      options: { state: unknown },
    ) => void;

    yield call(navigate, '/loads/new', {
      state: {
        intelPrefill: result.prefill,
        intelLoadId: result.loadId,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to book load';
    yield put(bookLoadFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
