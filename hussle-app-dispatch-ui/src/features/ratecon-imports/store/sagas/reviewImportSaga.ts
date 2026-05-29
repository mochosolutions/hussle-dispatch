import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getNavigate } from 'utils/getNavigate';
import { extractErrorMessage } from 'utils/api/extractErrorMessage';
import { getRateconImport } from 'utils/api/ratecon-imports';
import type { RateconImportDetail } from 'utils/api/ratecon-imports';
import type { RateconReviewLocationState } from '../../types';
import {
  reviewImportFailure,
  reviewImportRequest,
  reviewImportSuccess,
} from '../reducers/rateconImportPageSlice';

type NavigateWithState = (path: string, options?: { state?: RateconReviewLocationState }) => void;

// Fetches the import detail (incl. prefill) then opens the prefilled Create Load page.
// Failed extractions carry prefill=null — same flow, the user fills the form manually.
export function* reviewImportSaga(
  action: ReturnType<typeof reviewImportRequest>,
): Generator {
  const { importId } = action.payload;

  try {
    const detail = (yield call(getRateconImport, importId)) as RateconImportDetail;

    const state: RateconReviewLocationState = {
      rateconImportId: detail.id,
      rateconPrefill: detail.prefill,
      rateconCustomerHint: detail.prefill?.customerHint ?? null,
      rateconRequiresReview: detail.requiresReview,
      rateconWarnings: detail.warnings,
      rateconSourceDocumentId: detail.documentId,
    };

    yield put(reviewImportSuccess({ importId }));

    const navigate = (yield call(getNavigate)) as NavigateWithState;
    yield call(navigate, '/loads/new', { state });
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to open ratecon import');
    yield put(reviewImportFailure({ importId, error: message }));
    yield put(notify({ message, variant: 'error' }));
  }
}
