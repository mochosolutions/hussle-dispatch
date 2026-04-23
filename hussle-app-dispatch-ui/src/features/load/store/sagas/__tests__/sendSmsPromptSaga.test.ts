import { call } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import { enqueueSnackbar } from 'notistack';
import { closeModal } from 'features/ui/store/reducers/uiSlice';
import { sendSmsPrompt } from 'utils/api/loads/smsPromptApi';
import type { SmsPromptScheduleResponse } from 'utils/api/loads/smsPromptApi';
import {
  fetchSmsPromptHistoryRequest,
  sendSmsPromptFailure,
  sendSmsPromptRequest,
  sendSmsPromptSuccess,
} from '../../reducers/loadPageSlice';
import { smsPromptEntityActions } from '../../reducers/smsPromptEntitySlice';
import { sendSmsPromptSaga } from '../sendSmsPromptSaga';

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

const buildPrompt = (): SmsPromptScheduleResponse => ({
  id: 'p-1',
  loadId: 'load-1',
  driverId: 'driver-1',
  organizationId: 'org-1',
  anchor: 'MANUAL',
  scheduledAt: '2026-04-22T00:00:00.000Z',
  status: 'PENDING',
  sentAt: null,
  twilioMessageSid: null,
  failureReason: null,
  createdAt: '2026-04-22T00:00:00.000Z',
  updatedAt: '2026-04-22T00:00:00.000Z',
});

describe('sendSmsPromptSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upserts entity, dispatches success, shows toast, and refetches history on success', async () => {
    const prompt = buildPrompt();

    await expectSaga(sendSmsPromptSaga, sendSmsPromptRequest({ loadId: 'load-1' }))
      .provide([[call(sendSmsPrompt, 'load-1'), prompt]])
      .put(smsPromptEntityActions.upsertMany([prompt]))
      .put(sendSmsPromptSuccess({ loadId: 'load-1', prompt }))
      .call(enqueueSnackbar, 'SMS prompt queued', { variant: 'success' })
      .put(fetchSmsPromptHistoryRequest({ loadId: 'load-1' }))
      .put(closeModal())
      .run();
  });

  it('dispatches failure and error toast when the API rejects', async () => {
    const error = new Error('Cooldown not elapsed');

    const result = await expectSaga(
      sendSmsPromptSaga,
      sendSmsPromptRequest({ loadId: 'load-1' }),
    )
      .provide([[call(sendSmsPrompt, 'load-1'), throwError(error)]])
      .put(sendSmsPromptFailure({ loadId: 'load-1', error: 'Cooldown not elapsed' }))
      .call(enqueueSnackbar, 'Cooldown not elapsed', { variant: 'error' })
      .run();

    const putEffects = result.effects.put ?? [];
    const didCloseModal = putEffects.some(
      (effect) => effect.payload.action.type === closeModal.type,
    );
    expect(didCloseModal).toBe(false);
  });

  it('unwraps the backend error envelope when the API rejects with a structured error', async () => {
    const error = Object.assign(new Error('Request failed with status code 409'), {
      response: { data: { errors: [{ message: 'Driver phone missing' }] } },
    });

    await expectSaga(sendSmsPromptSaga, sendSmsPromptRequest({ loadId: 'load-1' }))
      .provide([[call(sendSmsPrompt, 'load-1'), throwError(error)]])
      .put(sendSmsPromptFailure({ loadId: 'load-1', error: 'Driver phone missing' }))
      .call(enqueueSnackbar, 'Driver phone missing', { variant: 'error' })
      .run();
  });
});
