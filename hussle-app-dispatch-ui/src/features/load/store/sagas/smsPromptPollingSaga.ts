import { delay, put, race, take } from 'redux-saga/effects';
import {
  fetchSmsPromptHistoryRequest,
  startSmsPromptPolling,
  stopSmsPromptPolling,
} from '../reducers/loadPageSlice';

const DEFAULT_INTERVAL_MS = 30_000;

export function* smsPromptPollingSaga(
  action: ReturnType<typeof startSmsPromptPolling>,
): Generator {
  const { loadId } = action.payload;

  while (true) {
    yield put(fetchSmsPromptHistoryRequest({ loadId }));

    const result = (yield race({
      stop: take(stopSmsPromptPolling.type),
      tick: delay(DEFAULT_INTERVAL_MS),
    })) as { stop?: unknown; tick?: unknown };

    if (result.stop !== undefined) {
      break;
    }
  }
}

export default smsPromptPollingSaga;
