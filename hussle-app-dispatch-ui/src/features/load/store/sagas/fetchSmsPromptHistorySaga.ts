import { call, put } from 'redux-saga/effects';
import type { PaginationMeta } from 'features/carrier/types';
import { extractErrorMessage } from 'utils/api/extractErrorMessage';
import { listSmsPrompts } from 'utils/api/loads/smsPromptApi';
import type { SmsPromptScheduleResponse } from 'utils/api/loads/smsPromptApi';
import {
  fetchSmsPromptHistoryFailure,
  fetchSmsPromptHistoryRequest,
  fetchSmsPromptHistorySuccess,
} from '../reducers/loadPageSlice';
import { smsPromptEntityActions } from '../reducers/smsPromptEntitySlice';

interface ListResult {
  data: SmsPromptScheduleResponse[];
  meta: PaginationMeta;
}

export function* fetchSmsPromptHistorySaga(
  action: ReturnType<typeof fetchSmsPromptHistoryRequest>,
): Generator {
  const { loadId, page, limit } = action.payload;

  try {
    const result = (yield call(listSmsPrompts, loadId, { page, limit })) as ListResult;
    yield put(smsPromptEntityActions.upsertMany(result.data));
    yield put(
      fetchSmsPromptHistorySuccess({ loadId, data: result.data, meta: result.meta }),
    );
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to load SMS history');
    yield put(fetchSmsPromptHistoryFailure({ loadId, error: message }));
    // Silent error — history fetch failures are too noisy to surface as a toast.
  }
}
