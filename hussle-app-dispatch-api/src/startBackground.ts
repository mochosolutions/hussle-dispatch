import type { PrismaClient } from '@prisma/client';

import { createInvitationCleanupJob } from './auth/jobs/invitationCleanupJob';
import { createProcessedEventCleanup } from './shared/messaging/processedEventCleanup';
import type { Logger } from './shared/utils/logger';

import { initializeAuditSubscriber } from './audit';
import { initializeCarriersSubscriber } from './carriers';
import { startDocuments } from './documents';
import { initializeDriversSubscribers } from './drivers';
import { initializeIftaSubscriber } from './ifta';
import { initializeInvoiceSubscriber } from './invoices';
import { initializeLoadsSubscriber } from './loads';
import { initializeNotificationSubscriber } from './notifications';
import { initializeRateconSubscriber } from './ratecon-imports';
import { startAgreements, stopAgreements } from './agreements';
import { startSettlements } from './settlements';
import { initializeSmsPromptsSubscribers } from './sms-prompts';
import { initializeLoadIntelSubscriber } from './load-intel';

interface BackgroundDeps {
  prisma: PrismaClient;
  logger: Logger;
}

interface BackgroundHandles {
  stopAll: () => Promise<void>;
  // Readiness signal for the worker /health gate. `true` only after every
  // initialize*Subscriber() awaited resolution — never a hardcoded count.
  subscribersReady: boolean;
  subscriberCount: number;
}

const startSubscribers = async (): Promise<number> => {
  const subscriberResults = await Promise.all([
    initializeAuditSubscriber(),
    initializeNotificationSubscriber(),
    initializeLoadsSubscriber(),
    initializeRateconSubscriber(),
    initializeDriversSubscribers(),
    initializeSmsPromptsSubscribers(),
    initializeInvoiceSubscriber(),
    initializeIftaSubscriber(),
    initializeCarriersSubscriber(),
    initializeLoadIntelSubscriber(),
  ]);

  startDocuments();
  await startAgreements();

  // Count = the awaited initialize* groups plus documents + agreements.
  return subscriberResults.length + 2;
};

const startCrons = (deps: BackgroundDeps): { stopProcessedEventCleanup: () => void; stopInvitationCleanup: () => void; stopSettlements: () => void } => {
  const processedEventCleanup = createProcessedEventCleanup({
    prisma: deps.prisma,
    logger: deps.logger,
  });
  processedEventCleanup.start();

  const invitationCleanup = createInvitationCleanupJob({
    prisma: deps.prisma,
    logger: deps.logger,
  });
  invitationCleanup.start();

  const { stop: stopSettlementsHandle } = startSettlements();

  return {
    stopProcessedEventCleanup: () => processedEventCleanup.stop(),
    stopInvitationCleanup: () => invitationCleanup.stop(),
    stopSettlements: stopSettlementsHandle,
  };
};

/**
 * Start all background work: 13 subscriber groups + 4 cron jobs.
 *
 * Returns a `stopAll()` handle that gracefully stops every cron and calls
 * `stopAgreements()` (watchdog shutdown). Subscriber teardown is handled by
 * `eventBus.close()` in the caller's shutdown sequence.
 *
 * Called by `src/index.ts` for ROLE=worker and ROLE=all.
 * Must NOT be imported by `src/app.ts`.
 */
export const startBackground = async (deps: BackgroundDeps): Promise<BackgroundHandles> => {
  const subscriberCount = await startSubscribers();
  const cronHandles = startCrons(deps);

  deps.logger.info('Background workers started', {
    subscribers: subscriberCount,
    crons: 4,
  });

  const stopAll = async (): Promise<void> => {
    stopAgreements();
    cronHandles.stopProcessedEventCleanup();
    cronHandles.stopInvitationCleanup();
    cronHandles.stopSettlements();
  };

  // `subscribersReady` is true here because `await startSubscribers()` has
  // resolved — the worker /health gate flips to 200 only once this returns.
  return { stopAll, subscribersReady: true, subscriberCount };
};
