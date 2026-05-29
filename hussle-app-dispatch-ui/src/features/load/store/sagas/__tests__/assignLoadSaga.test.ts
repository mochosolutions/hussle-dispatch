import { call } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { assignLoad } from 'utils/api/loads/loadApi';
import {
  assignLoadRequest,
  assignLoadFailure,
  setAssignBlockers,
} from '../../reducers/loadPageSlice';
import type { DispatchBlocker } from '../../../types';
import { assignLoadSaga } from '../assignLoadSaga';

// Narrow axios mock — only the `isAxiosError` guard is exercised here. A 422
// "axios error" is any thrown object carrying an isAxiosError flag + response.
jest.mock('axios', () => ({
  isAxiosError: (error: unknown): boolean =>
    typeof error === 'object' && error !== null && 'isAxiosError' in error,
}));

interface FakeAxiosError {
  message: string;
  isAxiosError: true;
  response: { status: number; data: { errors: { message: string }[]; blockers: DispatchBlocker[] } };
}

const build422 = (blockers: DispatchBlocker[]): FakeAxiosError => ({
  message: 'Request failed with status code 422',
  isAxiosError: true,
  response: {
    status: 422,
    data: { errors: [{ message: 'Dispatch blocked' }], blockers },
  },
});

describe('assignLoadSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches structured blockers on a 422 response', async () => {
    const blockers: DispatchBlocker[] = [
      { code: 'EQUIPMENT_MISMATCH', message: 'Equipment mismatch', overridable: true },
    ];
    const data = { carrierId: 'c-1', dispatcherUserId: 'u-1' };

    await expectSaga(assignLoadSaga, assignLoadRequest({ loadId: 'load-1', data }))
      .provide([[call(assignLoad, 'load-1', data), throwError(build422(blockers) as unknown as Error)]])
      .put(assignLoadFailure({ loadId: 'load-1', error: 'Equipment mismatch' }))
      .put(setAssignBlockers({ loadId: 'load-1', blockers }))
      .run();
  });

  it('does not dispatch blockers for a non-axios error', async () => {
    const error = new Error('Network down');
    const data = { carrierId: 'c-1', dispatcherUserId: 'u-1' };

    const result = await expectSaga(assignLoadSaga, assignLoadRequest({ loadId: 'load-1', data }))
      .provide([[call(assignLoad, 'load-1', data), throwError(error)]])
      .put(assignLoadFailure({ loadId: 'load-1', error: 'Network down' }))
      .run();

    const putEffects = result.effects.put ?? [];
    const didSetBlockers = putEffects.some(
      (effect) => effect.payload.action.type === setAssignBlockers.type,
    );
    expect(didSetBlockers).toBe(false);

    const didNotifyError = putEffects.some(
      (effect) =>
        effect.payload.action.type === notify.type &&
        effect.payload.action.payload.variant === 'error',
    );
    expect(didNotifyError).toBe(true);
  });
});
