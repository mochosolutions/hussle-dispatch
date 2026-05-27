import { delay, put, race, take } from 'redux-saga/effects';
import {
  fetchSmsPromptHistoryRequest,
  startSmsPromptPolling,
  stopSmsPromptPolling,
} from 'features/load/store/reducers/loadPageSlice';
import { smsPromptPollingSaga } from '../smsPromptPollingSaga';

describe('smsPromptPollingSaga', () => {
  it('dispatches fetchSmsPromptHistoryRequest and awaits race between stop action and delay', () => {
    const action = startSmsPromptPolling({ loadId: 'load-1' });
    const gen = smsPromptPollingSaga(action);

    expect(gen.next().value).toEqual(put(fetchSmsPromptHistoryRequest({ loadId: 'load-1' })));
    expect(gen.next().value).toEqual(
      race({
        stop: take(stopSmsPromptPolling.type),
        tick: delay(30_000),
      }),
    );
  });

  it('exits the loop when the stop action wins the race', () => {
    const action = startSmsPromptPolling({ loadId: 'load-1' });
    const gen = smsPromptPollingSaga(action);

    // First put (fetch)
    gen.next();
    // race effect
    gen.next();
    // Stop wins → loop breaks → generator done
    const result = gen.next({ stop: {} });
    expect(result.done).toBe(true);
  });
});
