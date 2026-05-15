import { randomUUID } from 'node:crypto';

import type { Request, RequestHandler, Response } from 'express';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { AgreementStatus } from '../types/agreementTypes';

interface DocusealWebhookControllerDeps {
  agreementRepo: AgreementRepoPort;
  eventBus: EventBus;
  logger: Logger;
  now?: () => Date;
}

interface DocusealWebhookBody {
  event_type?: string;
  data?: {
    submission_id?: string;
  };
}

type TargetStatus = 'SIGNED' | 'DECLINED' | 'EXPIRED';

const TARGET_BY_EVENT: Record<string, TargetStatus | null> = {
  'form.completed': 'SIGNED',
  'form.declined': 'DECLINED',
  'form.expired': 'EXPIRED',
  'form.viewed': null,
};

/**
 * Express controller for the DocuSeal webhook endpoint.
 *
 * Pre-condition: HMAC verification middleware has already run and reassigned
 * `req.body` to the parsed JSON object.
 *
 * State-machine guards: if the agreement is already in the target terminal
 * status, the webhook is a replay — return 200 with `replayed: true` and emit
 * no events.
 *
 * SIGNED defers persistence to `finalizeAgreement` (US-13 subscriber); the
 * controller only emits the event. DECLINED and EXPIRED have no S3 artifacts
 * to fetch, so they persist inline.
 */
export const docusealWebhookController = (
  deps: DocusealWebhookControllerDeps,
): RequestHandler =>
  async (req: Request, res: Response): Promise<void> => {
    const body = (req.body ?? {}) as DocusealWebhookBody;
    const eventType = body.event_type;
    const submissionId = body.data?.submission_id;

    if (!eventType || !submissionId) {
      res.status(400).json({
        errors: [{ message: 'missing event_type or submission_id' }],
      });
      return;
    }

    deps.logger.info('DocuSeal webhook received', { eventType, submissionId });

    const agreement = await deps.agreementRepo.findByProviderSubmissionId(submissionId);
    if (!agreement) {
      deps.logger.warn('Agreement not found for submission', { submissionId });
      res.status(404).json({ errors: [{ message: 'unknown submission_id' }] });
      return;
    }

    const target = TARGET_BY_EVENT[eventType] ?? null;
    if (target === null) {
      deps.logger.info('DocuSeal webhook event not state-changing', {
        eventType,
        submissionId,
        agreementId: agreement.id,
      });
      res.status(200).json({ received: true });
      return;
    }

    const currentStatus: AgreementStatus = agreement.status;
    if (currentStatus === target) {
      deps.logger.info('DocuSeal webhook replay — agreement already in target status', {
        eventType,
        submissionId,
        agreementId: agreement.id,
        status: currentStatus,
      });
      res.status(200).json({ received: true, replayed: true });
      return;
    }

    const now = (deps.now ?? (() => new Date()))();

    if (target === 'SIGNED') {
      const correlationId = randomUUID();
      await deps.eventBus.publish('agreement.signed', {
        agreementId: agreement.id,
        organizationId: agreement.organizationId,
        carrierId: agreement.carrierId,
        providerSubmissionId: submissionId,
        signedAt: now.toISOString(),
        correlationId,
      });
      deps.logger.info('Published agreement.signed', {
        agreementId: agreement.id,
        submissionId,
        correlationId,
      });
    } else if (target === 'DECLINED') {
      await deps.eventBus.publish('agreement.declined', {
        agreementId: agreement.id,
        organizationId: agreement.organizationId,
        carrierId: agreement.carrierId,
        providerSubmissionId: submissionId,
        declinedAt: now.toISOString(),
      });
      await deps.agreementRepo.update(agreement.id, {
        status: 'DECLINED',
        declinedAt: now,
      });
      deps.logger.info('Agreement declined via webhook', {
        agreementId: agreement.id,
        submissionId,
      });
    } else {
      await deps.eventBus.publish('agreement.expired', {
        agreementId: agreement.id,
        organizationId: agreement.organizationId,
        carrierId: agreement.carrierId,
        providerSubmissionId: submissionId,
        expiredAt: now.toISOString(),
      });
      await deps.agreementRepo.update(agreement.id, {
        status: 'EXPIRED',
        expiredAt: now,
      });
      deps.logger.info('Agreement expired via webhook', {
        agreementId: agreement.id,
        submissionId,
      });
    }

    res.status(200).json({ received: true });
  };
