import { call, put } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getNavigate } from 'utils/getNavigate';
import { bookChain } from 'utils/api/intel/loadIntelApi';
import type { BookChainResult } from '../../types';
import { bookChainSuccess, bookChainFailure } from '../reducers/intelPageSlice';

export function* bookChainSaga(action: PayloadAction<{ id: string }>): Generator {
  const { id } = action.payload;
  try {
    const result = (yield call(bookChain, id)) as BookChainResult;

    yield put(bookChainSuccess(result));

    yield put(notify({ message: 'Chain booked - creating outbound load', variant: 'success' }));

    const navigate = (yield call(getNavigate)) as (
      path: string,
      options: { state: unknown },
    ) => void;

    yield call(navigate, '/loads/new', {
      state: {
        intelPrefill: result.outboundPrefill,
        intelLoadId: result.loadId,
        backhaulData: result.backhaulData,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to book chain';
    yield put(bookChainFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
