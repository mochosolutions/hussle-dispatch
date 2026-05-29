import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { closeModal } from 'features/ui/store/reducers/uiSlice';
import { extractErrorMessage } from 'utils/api/extractErrorMessage';
import { sendSmsPrompt } from 'utils/api/loads/smsPromptApi';
import type { SmsPromptScheduleResponse } from 'utils/api/loads/smsPromptApi';
import {
  fetchSmsPromptHistoryRequest,
  sendSmsPromptFailure,
  sendSmsPromptRequest,
  sendSmsPromptSuccess,
} from '../reducers/loadPageSlice';
import { smsPromptEntityActions } from '../reducers/smsPromptEntitySlice';

export function* sendSmsPromptSaga(
  action: ReturnType<typeof sendSmsPromptRequest>,
): Generator {
  const { loadId, body } = action.payload;

  try {
    const prompt = (yield call(sendSmsPrompt, loadId, body)) as SmsPromptScheduleResponse;
    yield put(smsPromptEntityActions.upsertMany([prompt]));
    yield put(sendSmsPromptSuccess({ loadId, prompt }));
    yield put(notify({ message: 'SMS prompt queued', variant: 'success' }));
    yield put(fetchSmsPromptHistoryRequest({ loadId }));
    yield put(closeModal());
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to send SMS prompt');
    yield put(sendSmsPromptFailure({ loadId, error: message }));
    yield put(notify({ message: message, variant: 'error' }));
  }
}
