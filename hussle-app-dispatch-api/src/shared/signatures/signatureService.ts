/**
 * Signature service — wraps a SignatureProviderPort with retry on createSubmission,
 * fire-and-forget lifecycle event publishing, and correlationId tracking.
 *
 * Shared infrastructure utility (no controllers/routes) wired via a factory:
 * createSignatureService(deps) => SignatureService.
 */

import { randomUUID } from 'node:crypto';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import type { SignatureProviderPort } from './signatureProviderPort';
import type {
  CreateSubmissionInput,
  SignatureService,
  SignatureServiceOpts,
  SignedArtifacts,
  SubmissionRef,
  SubmissionStatus,
} from './types';

const RETRY_DELAYS_MS: readonly number[] = [1_000, 5_000, 30_000];

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const classifyError = (error: unknown): 'timeout' | 'rate_limit' | 'provider_error' => {
  const msg = errorMessage(error);
  if (/timeout/i.test(msg)) {
    return 'timeout';
  }
  if (/rate.?limit|429/i.test(msg)) {
    return 'rate_limit';
  }
  return 'provider_error';
};

export interface SignatureServiceDeps {
  provider: SignatureProviderPort;
  eventBus: EventBus;
  logger: Logger;
  uuid?: () => string;
  sleep?: (ms: number) => Promise<void>;
}

export const createSignatureService = (deps: SignatureServiceDeps): SignatureService => {
  const { provider, eventBus, logger } = deps;
  const uuid = deps.uuid ?? randomUUID;
  const sleep = deps.sleep ?? defaultSleep;

  const emitCreated = (
    correlationId: string,
    providerSubmissionId: string,
    templateKey: 'DISPATCH_AGREEMENT',
  ): void => {
    eventBus
      .publish('signature.submission.created', {
        correlationId,
        providerSubmissionId,
        templateKey,
      })
      .catch((error: unknown) => {
        logger.warn('signatureService event publish failed (created)', {
          correlationId,
          error: errorMessage(error),
        });
      });
  };

  const emitFailed = (
    correlationId: string,
    templateKey: 'DISPATCH_AGREEMENT',
    reason: 'timeout' | 'rate_limit' | 'provider_error',
  ): void => {
    eventBus
      .publish('signature.submission.failed', {
        correlationId,
        templateKey,
        reason,
      })
      .catch((error: unknown) => {
        logger.warn('signatureService event publish failed (failed)', {
          correlationId,
          error: errorMessage(error),
        });
      });
  };

  const attemptCreate = async (
    input: CreateSubmissionInput,
    correlationId: string,
  ): Promise<SubmissionRef> => {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        return await provider.createSubmission(input);
      } catch (error: unknown) {
        if (attempt === RETRY_DELAYS_MS.length) {
          const reason = classifyError(error);
          emitFailed(correlationId, input.templateKey, reason);
          throw error;
        }
        logger.warn('signatureService createSubmission failed — retrying', {
          attempt: attempt + 1,
          correlationId,
          error: errorMessage(error),
        });
        // noUncheckedIndexedAccess is on — narrow with explicit guard.
        const delay = RETRY_DELAYS_MS[attempt];
        if (delay !== undefined) {
          await sleep(delay);
        }
      }
    }
    // Unreachable: the loop either returns a ref or throws inside the catch above.
    throw new Error('signatureService.attemptCreate exited loop without resolution');
  };

  return {
    createSubmission: async (
      input: CreateSubmissionInput,
      opts?: SignatureServiceOpts,
    ): Promise<SubmissionRef> => {
      const correlationId = opts?.correlationId ?? uuid();
      logger.info('Creating signature submission', {
        templateKey: input.templateKey,
        correlationId,
      });

      const ref = await attemptCreate(input, correlationId);
      emitCreated(correlationId, ref.providerSubmissionId, input.templateKey);
      return ref;
    },

    getSubmission: async (providerSubmissionId: string): Promise<SubmissionStatus> => {
      logger.info('signatureService.getSubmission', { providerSubmissionId });
      return provider.getSubmission(providerSubmissionId);
    },

    voidSubmission: async (providerSubmissionId: string): Promise<void> => {
      logger.info('signatureService.voidSubmission', { providerSubmissionId });
      return provider.voidSubmission(providerSubmissionId);
    },

    fetchSignedArtifacts: async (providerSubmissionId: string): Promise<SignedArtifacts> => {
      logger.info('signatureService.fetchSignedArtifacts', { providerSubmissionId });
      return provider.fetchSignedArtifacts(providerSubmissionId);
    },
  };
};
