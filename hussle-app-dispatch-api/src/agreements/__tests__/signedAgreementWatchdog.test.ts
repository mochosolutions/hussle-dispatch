import type { ScheduledTask } from 'node-cron';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { SignatureService, SubmissionStatus } from '@/shared/signatures/types';
import type { Logger } from '@/shared/utils/logger';

import { createSignedAgreementWatchdog } from '../jobs/signedAgreementWatchdog';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { Agreement } from '../types/agreementTypes';

const mockSchedule = jest.fn();
const mockTaskStop = jest.fn();

jest.mock('node-cron', () => ({
  schedule: (...args: unknown[]) => mockSchedule(...args),
}));

const FIXED_NOW = new Date('2026-05-14T12:00:00.000Z');
const STALE_THRESHOLD_MIN = 30;
const INTERVAL_MIN = 5;

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
    status: 'PENDING',
    createdByUserId: null,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    signedAt: null,
    declinedAt: null,
    expiredAt: null,
    voidedAt: null,
    voidedByUserId: null,
    voidReason: null,
    signedPdfS3Key: null,
    auditCertificateS3Key: null,
    signedPdfSha256: null,
    ...overrides,
  }) as Agreement;

const makeRepo = (): jest.Mocked<AgreementRepoPort> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByProviderSubmissionId: jest.fn(),
  findManyByOrg: jest.fn(),
  update: jest.fn().mockImplementation(async (_id: string, _patch) => makeAgreement()),
  findStaleInProgress: jest.fn().mockResolvedValue([]),
  countActivePending: jest.fn(),
});

const makeSignatureService = (): jest.Mocked<SignatureService> => ({
  createSubmission: jest.fn(),
  getSubmission: jest.fn(),
  voidSubmission: jest.fn(),
  fetchSignedArtifacts: jest.fn(),
  refreshEmbedUrl: jest.fn(),
});

const makeEventBus = (): jest.Mocked<EventBus> => ({
  publish: jest.fn().mockResolvedValue(undefined),
  publishDelayed: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
});

const makeLogger = (): jest.Mocked<Logger> => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const makeDeps = () => ({
  agreementRepo: makeRepo(),
  signatureService: makeSignatureService(),
  eventBus: makeEventBus(),
  logger: makeLogger(),
  intervalMin: INTERVAL_MIN,
  staleThresholdMin: STALE_THRESHOLD_MIN,
  now: () => FIXED_NOW,
});

beforeEach(() => {
  mockSchedule.mockReset();
  mockTaskStop.mockReset();
  mockSchedule.mockReturnValue({ stop: mockTaskStop } as unknown as ScheduledTask);
});

describe('createSignedAgreementWatchdog – runNow', () => {
  it('does nothing when no stale agreements are returned', async () => {
    const deps = makeDeps();
    const watchdog = createSignedAgreementWatchdog(deps);

    await watchdog.runNow();

    expect(deps.signatureService.getSubmission).not.toHaveBeenCalled();
    expect(deps.eventBus.publish).not.toHaveBeenCalled();
    expect(deps.agreementRepo.update).not.toHaveBeenCalled();
  });

  it('republishes agreement.signed when provider returns signed (no repo update)', async () => {
    const deps = makeDeps();
    const ag = makeAgreement({ id: 'ag-signed', providerSubmissionId: 'sub_signed' });
    deps.agreementRepo.findStaleInProgress.mockResolvedValue([ag]);
    const signedAt = new Date('2026-05-14T11:55:00.000Z');
    deps.signatureService.getSubmission.mockResolvedValue({
      status: 'signed',
      providerSubmissionId: 'sub_signed',
      signedAt,
    } satisfies SubmissionStatus);

    const watchdog = createSignedAgreementWatchdog(deps);
    await watchdog.runNow();

    expect(deps.eventBus.publish).toHaveBeenCalledTimes(1);
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'agreement.signed',
      expect.objectContaining({
        agreementId: 'ag-signed',
        organizationId: 'org-1',
        carrierId: 'car-1',
        providerSubmissionId: 'sub_signed',
        signedAt: signedAt.toISOString(),
      }),
    );
    const publishedPayload = deps.eventBus.publish.mock.calls[0]?.[1] as {
      correlationId: string;
    };
    expect(publishedPayload.correlationId).toEqual(expect.any(String));
    expect(deps.agreementRepo.update).not.toHaveBeenCalled();
  });

  it('marks DECLINED and publishes agreement.declined when provider returns declined', async () => {
    const deps = makeDeps();
    const ag = makeAgreement({ id: 'ag-d', providerSubmissionId: 'sub_d' });
    deps.agreementRepo.findStaleInProgress.mockResolvedValue([ag]);
    const declinedAt = new Date('2026-05-14T11:50:00.000Z');
    deps.signatureService.getSubmission.mockResolvedValue({
      status: 'declined',
      providerSubmissionId: 'sub_d',
      declinedAt,
    });

    const watchdog = createSignedAgreementWatchdog(deps);
    await watchdog.runNow();

    expect(deps.agreementRepo.update).toHaveBeenCalledWith('ag-d', {
      status: 'DECLINED',
      declinedAt,
    });
    expect(deps.eventBus.publish).toHaveBeenCalledWith('agreement.declined', {
      agreementId: 'ag-d',
      organizationId: 'org-1',
      carrierId: 'car-1',
      providerSubmissionId: 'sub_d',
      declinedAt: declinedAt.toISOString(),
    });
  });

  it('marks EXPIRED and publishes agreement.expired when provider returns expired', async () => {
    const deps = makeDeps();
    const ag = makeAgreement({ id: 'ag-e', providerSubmissionId: 'sub_e' });
    deps.agreementRepo.findStaleInProgress.mockResolvedValue([ag]);
    const expiredAt = new Date('2026-05-14T11:30:00.000Z');
    deps.signatureService.getSubmission.mockResolvedValue({
      status: 'expired',
      providerSubmissionId: 'sub_e',
      expiredAt,
    });

    const watchdog = createSignedAgreementWatchdog(deps);
    await watchdog.runNow();

    expect(deps.agreementRepo.update).toHaveBeenCalledWith('ag-e', {
      status: 'EXPIRED',
      expiredAt,
    });
    expect(deps.eventBus.publish).toHaveBeenCalledWith('agreement.expired', {
      agreementId: 'ag-e',
      organizationId: 'org-1',
      carrierId: 'car-1',
      providerSubmissionId: 'sub_e',
      expiredAt: expiredAt.toISOString(),
    });
  });

  it('marks VOIDED and publishes agreement.voided when provider returns voided', async () => {
    const deps = makeDeps();
    const ag = makeAgreement({ id: 'ag-v', providerSubmissionId: 'sub_v' });
    deps.agreementRepo.findStaleInProgress.mockResolvedValue([ag]);
    const voidedAt = new Date('2026-05-14T11:20:00.000Z');
    deps.signatureService.getSubmission.mockResolvedValue({
      status: 'voided',
      providerSubmissionId: 'sub_v',
      voidedAt,
    });

    const watchdog = createSignedAgreementWatchdog(deps);
    await watchdog.runNow();

    expect(deps.agreementRepo.update).toHaveBeenCalledWith('ag-v', {
      status: 'VOIDED',
      voidedAt,
    });
    expect(deps.eventBus.publish).toHaveBeenCalledWith('agreement.voided', {
      agreementId: 'ag-v',
      organizationId: 'org-1',
      carrierId: 'car-1',
      voidedAt: voidedAt.toISOString(),
      voidReason: null,
      voidedByUserId: null,
    });
  });

  it('does nothing for a stale agreement still pending at the provider', async () => {
    const deps = makeDeps();
    const ag = makeAgreement({ id: 'ag-p', providerSubmissionId: 'sub_p' });
    deps.agreementRepo.findStaleInProgress.mockResolvedValue([ag]);
    deps.signatureService.getSubmission.mockResolvedValue({
      status: 'pending',
      providerSubmissionId: 'sub_p',
    });

    const watchdog = createSignedAgreementWatchdog(deps);
    await watchdog.runNow();

    expect(deps.agreementRepo.update).not.toHaveBeenCalled();
    expect(deps.eventBus.publish).not.toHaveBeenCalled();
  });

  it('continues to next agreement when a per-row reconcile throws', async () => {
    const deps = makeDeps();
    const bad = makeAgreement({ id: 'ag-bad', providerSubmissionId: 'sub_bad' });
    const good = makeAgreement({ id: 'ag-good', providerSubmissionId: 'sub_good' });
    deps.agreementRepo.findStaleInProgress.mockResolvedValue([bad, good]);
    deps.signatureService.getSubmission.mockImplementation(async (id: string) => {
      if (id === 'sub_bad') {
        throw new Error('provider down');
      }
      const signedAt = new Date('2026-05-14T11:55:00.000Z');
      return { status: 'signed', providerSubmissionId: 'sub_good', signedAt };
    });

    const watchdog = createSignedAgreementWatchdog(deps);
    await watchdog.runNow();

    expect(deps.logger.warn).toHaveBeenCalledWith(
      'Watchdog reconcile failed for agreement',
      expect.objectContaining({ agreementId: 'ag-bad', error: 'provider down' }),
    );
    expect(deps.eventBus.publish).toHaveBeenCalledTimes(1);
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'agreement.signed',
      expect.objectContaining({ agreementId: 'ag-good' }),
    );
  });

  it('skips agreements with null providerSubmissionId without calling the provider', async () => {
    const deps = makeDeps();
    const ag = makeAgreement({ id: 'ag-null', providerSubmissionId: null });
    deps.agreementRepo.findStaleInProgress.mockResolvedValue([ag]);

    const watchdog = createSignedAgreementWatchdog(deps);
    await watchdog.runNow();

    expect(deps.signatureService.getSubmission).not.toHaveBeenCalled();
    expect(deps.eventBus.publish).not.toHaveBeenCalled();
    expect(deps.logger.warn).toHaveBeenCalledWith(
      'Stale agreement missing providerSubmissionId',
      expect.objectContaining({ agreementId: 'ag-null' }),
    );
  });

  it('queries findStaleInProgress with now - staleThresholdMin minutes', async () => {
    const deps = makeDeps();
    const watchdog = createSignedAgreementWatchdog(deps);

    await watchdog.runNow();

    const expectedThreshold = new Date(FIXED_NOW.getTime() - STALE_THRESHOLD_MIN * 60 * 1000);
    expect(deps.agreementRepo.findStaleInProgress).toHaveBeenCalledWith(expectedThreshold);
  });
});

describe('createSignedAgreementWatchdog – start/stop', () => {
  it('start() registers a cron schedule with */<intervalMin> * * * *', () => {
    const deps = makeDeps();
    const watchdog = createSignedAgreementWatchdog(deps);

    watchdog.start();

    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockSchedule.mock.calls[0]?.[0]).toBe(`*/${INTERVAL_MIN} * * * *`);
  });

  it('start() called twice does not register a second schedule', () => {
    const deps = makeDeps();
    const watchdog = createSignedAgreementWatchdog(deps);

    watchdog.start();
    watchdog.start();

    expect(mockSchedule).toHaveBeenCalledTimes(1);
  });

  it('stop() calls task.stop() and clears state', () => {
    const deps = makeDeps();
    const watchdog = createSignedAgreementWatchdog(deps);

    watchdog.start();
    watchdog.stop();

    expect(mockTaskStop).toHaveBeenCalledTimes(1);

    // After stop, start() can re-register
    watchdog.start();
    expect(mockSchedule).toHaveBeenCalledTimes(2);
  });

  it('stop() before start() is a no-op', () => {
    const deps = makeDeps();
    const watchdog = createSignedAgreementWatchdog(deps);

    expect(() => watchdog.stop()).not.toThrow();
    expect(mockTaskStop).not.toHaveBeenCalled();
  });
});
