import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import type { SignatureProviderPort } from '../signatureProviderPort';
import { createSignatureService } from '../signatureService';
import type { SubmissionRef, SubmissionStatus } from '../types';

const makeRef = (overrides: Partial<SubmissionRef> = {}): SubmissionRef => ({
  providerSubmissionId: 'sub_123',
  embedUrl: 'https://example.com/embed/sub_123',
  expiresAt: new Date('2026-12-31T00:00:00.000Z'),
  ...overrides,
});

interface TestDeps {
  provider: jest.Mocked<SignatureProviderPort>;
  eventBus: jest.Mocked<EventBus>;
  logger: jest.Mocked<Logger>;
  sleep: jest.Mock<Promise<void>, [number]>;
  uuid: jest.Mock<string, []>;
}

const makeDeps = (): TestDeps => {
  const provider: jest.Mocked<SignatureProviderPort> = {
    createSubmission: jest.fn(),
    getSubmission: jest.fn(),
    voidSubmission: jest.fn(),
    fetchSignedArtifacts: jest.fn(),
  };
  const eventBus: jest.Mocked<EventBus> = {
    publish: jest.fn().mockResolvedValue(undefined),
    publishDelayed: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const sleep = jest.fn<Promise<void>, [number]>().mockResolvedValue(undefined);
  const uuid = jest.fn<string, []>().mockReturnValue('uuid-1234');
  return { provider, eventBus, logger, sleep, uuid };
};

const flushMicrotasks = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

const baseInput = () => ({
  templateKey: 'DISPATCH_AGREEMENT' as const,
  variables: { carrierName: 'Acme' },
  signer: { name: 'Alice', email: 'alice@example.com' },
});

describe('createSignatureService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubmission — success path', () => {
    it('returns provider ref and publishes exactly one created event', async () => {
      const deps = makeDeps();
      const ref = makeRef();
      deps.provider.createSubmission.mockResolvedValue(ref);
      const service = createSignatureService(deps);

      const result = await service.createSubmission(baseInput());

      expect(result).toBe(ref);
      expect(deps.eventBus.publish).toHaveBeenCalledTimes(1);
      expect(deps.eventBus.publish).toHaveBeenCalledWith('signature.submission.created', {
        correlationId: 'uuid-1234',
        providerSubmissionId: ref.providerSubmissionId,
        templateKey: 'DISPATCH_AGREEMENT',
      });
      const failedCalls = deps.eventBus.publish.mock.calls.filter(
        (call) => call[0] === 'signature.submission.failed',
      );
      expect(failedCalls).toHaveLength(0);
      expect(deps.sleep).not.toHaveBeenCalled();
    });
  });

  describe('createSubmission — correlationId handling', () => {
    it('uses caller-supplied correlationId verbatim and does not call uuid', async () => {
      const deps = makeDeps();
      deps.provider.createSubmission.mockResolvedValue(makeRef());
      const service = createSignatureService(deps);

      await service.createSubmission(baseInput(), { correlationId: 'caller-corr-id' });

      expect(deps.uuid).not.toHaveBeenCalled();
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'signature.submission.created',
        expect.objectContaining({ correlationId: 'caller-corr-id' }),
      );
    });

    it('generates a UUID correlationId when opts omitted', async () => {
      const deps = makeDeps();
      deps.provider.createSubmission.mockResolvedValue(makeRef());
      const service = createSignatureService(deps);

      await service.createSubmission(baseInput());

      expect(deps.uuid).toHaveBeenCalledTimes(1);
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'signature.submission.created',
        expect.objectContaining({ correlationId: 'uuid-1234' }),
      );
    });
  });

  describe('createSubmission — retry behavior', () => {
    it('retries on provider throw and returns eventual ref', async () => {
      const deps = makeDeps();
      const ref = makeRef();
      deps.provider.createSubmission
        .mockRejectedValueOnce(new Error('timeout: gateway timed out'))
        .mockRejectedValueOnce(new Error('timeout: gateway timed out'))
        .mockResolvedValueOnce(ref);
      const service = createSignatureService(deps);

      const result = await service.createSubmission(baseInput());

      expect(result).toBe(ref);
      expect(deps.sleep).toHaveBeenCalledTimes(2);
      expect(deps.sleep).toHaveBeenNthCalledWith(1, 1000);
      expect(deps.sleep).toHaveBeenNthCalledWith(2, 5000);
      expect(deps.logger.warn).toHaveBeenCalledTimes(2);
      const createdCalls = deps.eventBus.publish.mock.calls.filter(
        (call) => call[0] === 'signature.submission.created',
      );
      const failedCalls = deps.eventBus.publish.mock.calls.filter(
        (call) => call[0] === 'signature.submission.failed',
      );
      expect(createdCalls).toHaveLength(1);
      expect(failedCalls).toHaveLength(0);
    });

    it('exhausts retry budget (4 total attempts) and rethrows original error', async () => {
      const deps = makeDeps();
      const originalError = new Error('timeout');
      deps.provider.createSubmission.mockRejectedValue(originalError);
      const service = createSignatureService(deps);

      await expect(service.createSubmission(baseInput())).rejects.toThrow('timeout');

      expect(deps.provider.createSubmission).toHaveBeenCalledTimes(4);
      expect(deps.sleep).toHaveBeenCalledTimes(3);
      expect(deps.sleep).toHaveBeenNthCalledWith(1, 1000);
      expect(deps.sleep).toHaveBeenNthCalledWith(2, 5000);
      expect(deps.sleep).toHaveBeenNthCalledWith(3, 30000);
      const failedCalls = deps.eventBus.publish.mock.calls.filter(
        (call) => call[0] === 'signature.submission.failed',
      );
      expect(failedCalls).toHaveLength(1);
      expect(failedCalls[0]?.[1]).toEqual({
        correlationId: 'uuid-1234',
        templateKey: 'DISPATCH_AGREEMENT',
        reason: 'timeout',
      });
    });
  });

  describe('createSubmission — error classification', () => {
    it('classifies "429 rate limit" errors as rate_limit', async () => {
      const deps = makeDeps();
      deps.provider.createSubmission.mockRejectedValue(new Error('429 rate limit hit'));
      const service = createSignatureService(deps);

      await expect(service.createSubmission(baseInput())).rejects.toThrow('429 rate limit hit');

      expect(deps.eventBus.publish).toHaveBeenCalledWith('signature.submission.failed', {
        correlationId: 'uuid-1234',
        templateKey: 'DISPATCH_AGREEMENT',
        reason: 'rate_limit',
      });
    });

    it('classifies generic errors as provider_error', async () => {
      const deps = makeDeps();
      deps.provider.createSubmission.mockRejectedValue(new Error('connection refused'));
      const service = createSignatureService(deps);

      await expect(service.createSubmission(baseInput())).rejects.toThrow('connection refused');

      expect(deps.eventBus.publish).toHaveBeenCalledWith('signature.submission.failed', {
        correlationId: 'uuid-1234',
        templateKey: 'DISPATCH_AGREEMENT',
        reason: 'provider_error',
      });
    });
  });

  describe('createSubmission — fire-and-forget event publish', () => {
    it('swallows event publish rejection, logs warn, returns ref to caller', async () => {
      const deps = makeDeps();
      const ref = makeRef();
      deps.provider.createSubmission.mockResolvedValue(ref);
      deps.eventBus.publish.mockRejectedValue(new Error('rabbitmq down'));
      const service = createSignatureService(deps);

      const result = await service.createSubmission(baseInput());
      await flushMicrotasks();

      expect(result).toBe(ref);
      const warnCalls = deps.logger.warn.mock.calls.filter((call) =>
        String(call[0]).includes('event publish failed'),
      );
      expect(warnCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getSubmission', () => {
    it('proxies to provider without retry or events', async () => {
      const deps = makeDeps();
      const status: SubmissionStatus = {
        status: 'signed',
        providerSubmissionId: 'sub_123',
        signedAt: new Date('2026-06-01T00:00:00.000Z'),
      };
      deps.provider.getSubmission.mockResolvedValue(status);
      const service = createSignatureService(deps);

      const result = await service.getSubmission('sub_123');

      expect(result).toBe(status);
      expect(deps.provider.getSubmission).toHaveBeenCalledWith('sub_123');
      expect(deps.eventBus.publish).not.toHaveBeenCalled();
      expect(deps.sleep).not.toHaveBeenCalled();
    });
  });

  describe('voidSubmission', () => {
    it('proxies to provider without retry or events', async () => {
      const deps = makeDeps();
      deps.provider.voidSubmission.mockResolvedValue(undefined);
      const service = createSignatureService(deps);

      await service.voidSubmission('sub_123');

      expect(deps.provider.voidSubmission).toHaveBeenCalledWith('sub_123');
      expect(deps.eventBus.publish).not.toHaveBeenCalled();
      expect(deps.sleep).not.toHaveBeenCalled();
    });
  });

  describe('fetchSignedArtifacts', () => {
    it('proxies to provider without retry or events', async () => {
      const deps = makeDeps();
      const artifacts = {
        signedPdf: Buffer.from('pdf-bytes'),
        auditCertificate: Buffer.from('audit-bytes'),
      };
      deps.provider.fetchSignedArtifacts.mockResolvedValue(artifacts);
      const service = createSignatureService(deps);

      const result = await service.fetchSignedArtifacts('sub_123');

      expect(result).toBe(artifacts);
      expect(deps.provider.fetchSignedArtifacts).toHaveBeenCalledWith('sub_123');
      expect(deps.eventBus.publish).not.toHaveBeenCalled();
      expect(deps.sleep).not.toHaveBeenCalled();
    });
  });
});
