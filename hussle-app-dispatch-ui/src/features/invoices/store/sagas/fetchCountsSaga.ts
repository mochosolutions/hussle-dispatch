import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { getInvoiceCounts } from 'utils/api/invoices/invoiceApi';
import {
  fetchCountsSuccess,
  fetchCountsFailure,
} from '../reducers/invoicePageSlice';

export function* fetchCountsSaga(): Generator {
  try {
    const counts = (yield call(getInvoiceCounts)) as SagaReturnType<typeof getInvoiceCounts>;

    yield put(fetchCountsSuccess({ counts }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch invoice counts';
    yield put(fetchCountsFailure({ error: errorMessage }));
  }
}
