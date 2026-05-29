import { call } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import { createLoad } from 'utils/api/loads/loadApi';
import { createLoadFailure, setCreateBlockers } from '../../reducers/loadPageSlice';
import type { CreateLoadInput, DispatchBlocker } from '../../../types';
import { createLoadSaga } from '../createLoadSaga';

const buildInput = (): CreateLoadInput => ({
  status: 'BOOKED',
  stops: [
    { type: 'PICKUP', sequence: 1, appointmentStart: '2026-06-01T00:00:00.000Z' },
    { type: 'DELIVERY', sequence: 2, appointmentStart: '2026-06-02T00:00:00.000Z' },
  ],
});

describe('createLoadSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extracts structured blockers from a 422 response and dispatches them', async () => {
    const data = buildInput();
    const blockers: DispatchBlocker[] = [
      { code: 'DRIVER_LICENSE_EXPIRED', message: 'Driver license expired', overridable: true },
    ];
    const error = Object.assign(new Error('Request failed with status code 422'), {
      response: {
        status: 422,
        data: { errors: [{ message: 'Driver license expired' }], blockers },
      },
    });

    await expectSaga(createLoadSaga, {
      type: 'load/createRequest',
      payload: { data, queuedDocuments: [] },
    })
      .provide([[call(createLoad, data), throwError(error)]])
      .put(createLoadFailure({ error: 'Driver license expired' }))
      .put(setCreateBlockers(blockers))
      .run();
  });

  it('dispatches an empty blocker array when the failure carries no blockers', async () => {
    const data = buildInput();
    const error = new Error('Boom');

    await expectSaga(createLoadSaga, {
      type: 'load/createRequest',
      payload: { data, queuedDocuments: [] },
    })
      .provide([[call(createLoad, data), throwError(error)]])
      .put(createLoadFailure({ error: 'Boom' }))
      .put(setCreateBlockers([]))
      .run();
  });
});
