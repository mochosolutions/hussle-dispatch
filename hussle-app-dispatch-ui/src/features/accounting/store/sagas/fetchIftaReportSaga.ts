import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getIftaReport } from 'utils/api/accounting/iftaApi';
import {
  fetchIftaReportSuccess,
  fetchIftaReportFailure,
  type IftaFilters,
} from '../reducers/iftaPageSlice';

export function* fetchIftaReportSaga(action: PayloadAction<IftaFilters>): Generator {
  try {
    const report = (yield call(getIftaReport, action.payload)) as SagaReturnType<
      typeof getIftaReport
    >;
    yield put(fetchIftaReportSuccess(report));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load IFTA report';
    yield put(fetchIftaReportFailure(message));
    yield put(notify({ message: 'Failed to load IFTA report', variant: 'error' }));
  }
}
