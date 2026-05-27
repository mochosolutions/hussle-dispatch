import { randomUUID } from 'node:crypto';

import type { ScheduledTask } from 'node-cron';
import { schedule } from 'node-cron';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { SignatureService } from '@/shared/signatures/types';
import type { Logger } from '@/shared/utils/logger';

import type { AgreementRepoPort } from '../types/agreementRepoPort';

export interface SignedAgreementWatchdogDeps {
  agreementRepo: AgreementRepoPort;
  signatureService: SignatureService;
  eventBus: EventBus;
  logger: Logger;
  intervalMin: number;
  staleThresholdMin: number;
  now?: () => Date;
}

export interface SignedAgreementWatchdog {
  start(): void;
  stop(): void;
  runNow(): Promise<void>;
}

/**
 * Background watchdog that reconciles PENDING agreements with the signature
 * provider. For agreements last updated longer than `staleThresholdMin` ago,
 * it polls the provider and:
 *   - signed   → republish `agreement.signed` (subscriber finalizes; idempotent)
 *   - declined → mark DECLINED + publish `agreement.declined`
 *   - expired  → mark EXPIRED  + publish `agreement.expired`
 *   - voided   → mark VOIDED   + publish `agreement.voided`
 *   - pending  → no-op
 *
 * Per-agreement failures are logged and skipped — one bad row does not abort
 * the whole run.
 */
export const createSignedAgreementWatchdog = (
  deps: SignedAgreementWatchdogDeps,
): SignedAgreementWatchdog => {
  let task: ScheduledTask | null = null;
  const nowFn = deps.now ?? ((): Date => new Date());

  const runNow = async (): Promise<void> => {
    const current = nowFn();
    const threshold = new Date(current.getTime() - deps.staleThresholdMin * 60 * 1000);
    const stale = await deps.agreementRepo.findStaleInProgress(threshold);

    deps.logger.info('Agreement watchdog scanning', {
      count: stale.length,
      threshold: threshold.toISOString(),
    });

    for (const agreement of stale) {
      if (agreement.providerSubmissionId === null) {
        deps.logger.warn('Stale agreement missing providerSubmissionId', {
          agreementId: agreement.id,
        });
        continue;
      }

      const providerSubmissionId = agreement.providerSubmissionId;

      try {
        const status = await deps.signatureService.getSubmission(providerSubmissionId);

        switch (status.status) {
          case 'signed':
            await deps.eventBus.publish('agreement.signed', {
              agreementId: agreement.id,
              organizationId: agreement.organizationId,
              carrierId: agreement.carrierId,
              providerSubmissionId,
              signedAt: status.signedAt.toISOString(),
              correlationId: randomUUID(),
            });
            break;
          case 'declined':
            await deps.agreementRepo.update(agreement.id, {
              status: 'DECLINED',
              declinedAt: status.declinedAt,
            });
            await deps.eventBus.publish('agreement.declined', {
              agreementId: agreement.id,
              organizationId: agreement.organizationId,
              carrierId: agreement.carrierId,
              providerSubmissionId,
              declinedAt: status.declinedAt.toISOString(),
            });
            break;
          case 'expired':
            await deps.agreementRepo.update(agreement.id, {
              status: 'EXPIRED',
              expiredAt: status.expiredAt,
            });
            await deps.eventBus.publish('agreement.expired', {
              agreementId: agreement.id,
              organizationId: agreement.organizationId,
              carrierId: agreement.carrierId,
              providerSubmissionId,
              expiredAt: status.expiredAt.toISOString(),
            });
            break;
          case 'voided':
            await deps.agreementRepo.update(agreement.id, {
              status: 'VOIDED',
              voidedAt: status.voidedAt,
            });
            await deps.eventBus.publish('agreement.voided', {
              agreementId: agreement.id,
              organizationId: agreement.organizationId,
              carrierId: agreement.carrierId,
              voidedAt: status.voidedAt.toISOString(),
              voidReason: null,
              voidedByUserId: null,
            });
            break;
          case 'pending':
            // Provider still pending — leave it alone for the next run.
            break;
          default: {
            const exhaust: never = status;
            throw new Error(`Unhandled submission status variant: ${JSON.stringify(exhaust)}`);
          }
        }
      } catch (error: unknown) {
        deps.logger.warn('Watchdog reconcile failed for agreement', {
          agreementId: agreement.id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue — one failed reconcile must not abort the run.
      }
    }
  };

  const start = (): void => {
    if (task !== null) {
      return;
    }
    const cronExpr = `*/${deps.intervalMin} * * * *`;
    task = schedule(cronExpr, () => {
      runNow().catch((error: unknown) => {
        deps.logger.error('Agreement watchdog run failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    });
    deps.logger.info('Agreement watchdog scheduled', { cronExpr });
  };

  const stop = (): void => {
    if (task !== null) {
      task.stop();
      task = null;
      deps.logger.info('Agreement watchdog stopped');
    }
  };

  return { start, stop, runNow };
};
