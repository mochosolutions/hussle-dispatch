import type { EventBus } from '@/shared/messaging/eventBus';
import type { EventMap } from '@/shared/messaging/eventMap';
import type { Logger } from '@/shared/utils/logger';

import { initializeAgreementSignedSubscriber } from '../subscribers/agreementSignedSubscriber';
import type { AgreementServiceResult } from '../types/agreementServiceResult';
import type { Agreement } from '../types/agreementTypes';

const FIXED_NOW = new Date('2026-05-14T12:00:00.000Z');

const makeAgreement = (overrides: Partial<Agreement> = {}): Agreement =>
  ({
    id: 'ag-1',
    organizationId: 'org-1',
    carrierId: 'car-1',
    templateKey: 'DISPATCH_AGREEMENT',
    providerName: 'MOCK',
    providerSubmissionId: 'sub_abc',
    embedUrl: null,
    embedUrlExpiresAt: null,
    signerName: null,
    signerEmail: null,
    variables: {},
    status: 'SIGNED',
    createdByUserId: null,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    signedAt: FIXED_NOW,
    declinedAt: null,
    expiredAt: null,
    voidedAt: null,
    voidedByUserId: null,
    voidReason: null,
    signedPdfS3Key: 's3/signed.pdf',
    auditCertificateS3Key: 's3/audit.pdf',
    signedPdfSha256: 'abc123',
    ...overrides,
  }) as Agreement;

const makeLogger = (): jest.Mocked<Logger> => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const makeEventBus = (): jest.Mocked<EventBus> => ({
  publish: jest.fn().mockResolvedValue(undefined),
  publishDelayed: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
});

const signedPayload: EventMap['agreement.signed'] = {
  agreementId: 'ag-1',
  organizationId: 'org-1',
  carrierId: 'car-1',
  providerSubmissionId: 'sub_abc',
  signedAt: FIXED_NOW.toISOString(),
  correlationId: 'corr-1',
};

const captureHandler = (
  eventBus: jest.Mocked<EventBus>,
): ((payload: EventMap['agreement.signed']) => Promise<void>) => {
  const call = eventBus.subscribe.mock.calls[0];
  if (!call) {
    throw new Error('eventBus.subscribe was not called');
  }
  const handler = call[2] as (payload: EventMap['agreement.signed']) => Promise<void>;
  return handler;
};

describe('initializeAgreementSignedSubscriber', () => {
  let eventBus: jest.Mocked<EventBus>;
  let logger: jest.Mocked<Logger>;
  let finalizeAgreement: jest.Mock<
    Promise<AgreementServiceResult<Agreement>>,
    [{ providerSubmissionId: string }]
  >;

  beforeEach(() => {
    eventBus = makeEventBus();
    logger = makeLogger();
    finalizeAgreement = jest.fn();
  });

  it('subscribes to agreement.signed with the agreements.signed-finalizer queue group', async () => {
    await initializeAgreementSignedSubscriber({
      eventBus,
      finalizeAgreement,
      logger,
    });

    expect(eventBus.subscribe).toHaveBeenCalledTimes(1);
    const [eventName, queueGroup, handler] = eventBus.subscribe.mock.calls[0] ?? [];
    expect(eventName).toBe('agreement.signed');
    expect(queueGroup).toBe('agreements.signed-finalizer');
    expect(typeof handler).toBe('function');
  });

  it('calls finalizeAgreement with providerSubmissionId from payload', async () => {
    finalizeAgreement.mockResolvedValue({ data: makeAgreement(), events: [] });
    await initializeAgreementSignedSubscriber({
      eventBus,
      finalizeAgreement,
      logger,
    });
    const handler = captureHandler(eventBus);

    await handler(signedPayload);

    expect(finalizeAgreement).toHaveBeenCalledWith({ providerSubmissionId: 'sub_abc' });
  });

  it('republishes agreement.finalized event when finalizeAgreement returns it', async () => {
    const finalizedPayload: EventMap['agreement.finalized'] = {
      agreementId: 'ag-1',
      organizationId: 'org-1',
      carrierId: 'car-1',
      signedPdfS3Key: 's3/signed.pdf',
      auditCertificateS3Key: 's3/audit.pdf',
      signedPdfSha256: 'abc123',
    };

    finalizeAgreement.mockResolvedValue({
      data: makeAgreement(),
      events: [
        {
          type: 'agreement.finalized',
          occurredAt: FIXED_NOW,
          payload: finalizedPayload,
        },
      ],
    });

    await initializeAgreementSignedSubscriber({
      eventBus,
      finalizeAgreement,
      logger,
    });
    const handler = captureHandler(eventBus);

    await handler(signedPayload);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith('agreement.finalized', finalizedPayload);
    expect(logger.info).toHaveBeenCalledWith(
      'Agreement finalized via subscriber',
      expect.objectContaining({ agreementId: 'ag-1', republishedEvents: 1 }),
    );
  });

  it('does not publish further events when finalizeAgreement is idempotent (events: [])', async () => {
    finalizeAgreement.mockResolvedValue({ data: makeAgreement(), events: [] });
    await initializeAgreementSignedSubscriber({
      eventBus,
      finalizeAgreement,
      logger,
    });
    const handler = captureHandler(eventBus);

    await handler(signedPayload);

    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      'Agreement finalized via subscriber',
      expect.objectContaining({ republishedEvents: 0 }),
    );
  });

  it('logs and rethrows when finalizeAgreement throws (for RabbitMQ retry / DLQ)', async () => {
    finalizeAgreement.mockRejectedValue(new Error('boom'));
    await initializeAgreementSignedSubscriber({
      eventBus,
      finalizeAgreement,
      logger,
    });
    const handler = captureHandler(eventBus);

    await expect(handler(signedPayload)).rejects.toThrow('boom');
    expect(logger.error).toHaveBeenCalledWith(
      'agreementSignedSubscriber failed',
      expect.objectContaining({
        providerSubmissionId: 'sub_abc',
        error: 'boom',
      }),
    );
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
