import type { PrismaClient } from '@prisma/client';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { SignatureProviderPort } from '@/shared/signatures/signatureProviderPort';
import type { SignatureService } from '@/shared/signatures/types';
import type { StorageProvider } from '@/shared/storage';
import type { Logger } from '@/shared/utils/logger';

import { getAgreementController } from './controllers/getAgreementController';
import { listAgreementsController } from './controllers/listAgreementsController';
import { requestAgreementController } from './controllers/requestAgreementController';
import { voidAgreementController } from './controllers/voidAgreementController';
import { createSignedAgreementWatchdog } from './jobs/signedAgreementWatchdog';
import { createCarrierQueries } from './queries/carrierQueries';
import { createOrganizationQueries } from './queries/organizationQueries';
import { agreementRepositoryPrisma } from './repositories/agreementRepositoryPrisma';
import { createAgreementsRouter } from './routes/agreementRoutes';
import type { EnsureAgreementForCarrierInput } from './services/ensureAgreementForCarrier';
import { ensureAgreementForCarrier } from './services/ensureAgreementForCarrier';
import type { FinalizeAgreementInput } from './services/finalizeAgreement';
import { finalizeAgreement } from './services/finalizeAgreement';
import type { MockSignAgreementInput } from './services/mockSignAgreement';
import { mockSignAgreement } from './services/mockSignAgreement';
import type { RequestAgreementInput } from './services/requestAgreement';
import { requestAgreement } from './services/requestAgreement';
import type { VoidAgreementInput } from './services/voidAgreement';
import { voidAgreement } from './services/voidAgreement';
import type { VoidForReSignInput } from './services/voidForReSign';
import { voidForReSign } from './services/voidForReSign';
import { initializeAgreementSignedSubscriber } from './subscribers/agreementSignedSubscriber';
import type { AgreementServiceResult } from './types/agreementServiceResult';
import type { Agreement } from './types/agreementTypes';
import { docusealWebhookController } from './webhooks/docusealWebhookController';
import { createDocusealWebhookRouter } from './webhooks/docusealWebhookRoutes';
import { createVerifyDocusealHmac } from './webhooks/verifyDocusealHmacMiddleware';

export interface AgreementsModuleEnv {
  SIGNATURE_PROVIDER: 'mock' | 'docuseal';
  AGREEMENT_WATCHDOG_INTERVAL_MIN: number;
  AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN: number;
  DOCUSEAL_WEBHOOK_SECRET: string;
}

export interface AgreementsModuleDeps {
  prisma: PrismaClient;
  eventBus: EventBus;
  logger: Logger;
  storage: StorageProvider;
  signatureService: SignatureService;
  signatureProvider: SignatureProviderPort;
  env: AgreementsModuleEnv;
}

export interface AgreementsModuleQueries {
  findLatestForCarrier: (
    carrierId: string,
    templateKey: import('@prisma/client').AgreementTemplateKey,
  ) => Promise<import('./types/agreementTypes').Agreement | null>;
  /**
   * Idempotent get-or-create for a carrier's agreement. Used by the carrier
   * portal as a safety net when the dispatcher hasn't pre-generated one.
   */
  ensureForCarrier: (
    input: EnsureAgreementForCarrierInput,
  ) => Promise<AgreementServiceResult<Agreement>>;
  /**
   * Void every signed agreement for the carrier when an identity field
   * (legalName / mcNumber / dotNumber) is about to change. Clears the
   * Carrier.dispatchAgreementSignedAt projection so saveCompany succeeds and
   * the carrier returns to the signing step.
   */
  voidForReSign: (input: VoidForReSignInput) => Promise<{ voidedAgreementIds: string[] }>;
  /**
   * Dev-only mock-sign. Undefined when SIGNATURE_PROVIDER !== 'mock' so the
   * carrier-portal route stays unmounted in production (404 by default).
   */
  mockSignAgreement?: (
    input: MockSignAgreementInput,
  ) => Promise<AgreementServiceResult<Agreement>>;
}

export interface AgreementsModule {
  agreementsRouter: ReturnType<typeof createAgreementsRouter>;
  docusealWebhookRouter: ReturnType<typeof createDocusealWebhookRouter>;
  queries: AgreementsModuleQueries;
  initialize: () => Promise<void>;
  shutdown: () => void;
}

/**
 * Wire the agreements module: repositories, queries, services, controllers,
 * subscribers, watchdog, and routers.
 *
 * `initialize()` registers the agreement.signed subscriber and starts the
 * watchdog. `shutdown()` stops the watchdog (subscriber teardown is owned by
 * the shared event bus close).
 */
export const createAgreementsModule = (deps: AgreementsModuleDeps): AgreementsModule => {
  const agreementRepo = agreementRepositoryPrisma(deps.prisma);
  const carrierQueries = createCarrierQueries(deps.prisma);
  const orgQueries = createOrganizationQueries(deps.prisma);

  const providerName: 'MOCK' | 'DOCUSEAL' =
    deps.env.SIGNATURE_PROVIDER === 'docuseal' ? 'DOCUSEAL' : 'MOCK';

  // The mock provider exposes a `__testHelpers.markSigned` namespace so dev
  // mode can flip submission state without DocuSeal. The docuseal provider
  // does not — narrowing here keeps the production port surface clean.
  const providerWithTestHelpers = deps.signatureProvider as SignatureProviderPort & {
    __testHelpers?: { markSigned(providerSubmissionId: string): void };
  };
  const markSigned = providerWithTestHelpers.__testHelpers?.markSigned;

  const requestAgreementBound = (
    input: RequestAgreementInput,
  ): Promise<AgreementServiceResult<Agreement>> =>
    requestAgreement(input, {
      agreementRepo,
      signatureService: deps.signatureService,
      carrierQueries,
      providerName,
      logger: deps.logger,
    });

  const voidAgreementBound = (
    input: VoidAgreementInput,
  ): Promise<AgreementServiceResult<Agreement>> =>
    voidAgreement(input, {
      agreementRepo,
      signatureService: deps.signatureService,
      logger: deps.logger,
    });

  const finalizeAgreementBound = (
    input: FinalizeAgreementInput,
  ): Promise<AgreementServiceResult<Agreement>> =>
    finalizeAgreement(input, {
      agreementRepo,
      signatureService: deps.signatureService,
      storage: deps.storage,
      logger: deps.logger,
    });

  const controllers = {
    request: requestAgreementController({
      requestAgreement: requestAgreementBound,
      orgQueries,
      eventBus: deps.eventBus,
      storage: deps.storage,
      logger: deps.logger,
    }),
    list: listAgreementsController({
      agreementRepo,
      storage: deps.storage,
    }),
    get: getAgreementController({
      agreementRepo,
      signatureService: deps.signatureService,
      storage: deps.storage,
      logger: deps.logger,
    }),
    void: voidAgreementController({
      voidAgreement: voidAgreementBound,
      eventBus: deps.eventBus,
      storage: deps.storage,
      logger: deps.logger,
    }),
  };

  const webhookController = docusealWebhookController({
    agreementRepo,
    eventBus: deps.eventBus,
    logger: deps.logger,
  });

  const verifyHmac = createVerifyDocusealHmac({
    secret: deps.env.DOCUSEAL_WEBHOOK_SECRET,
    logger: deps.logger,
  });

  const watchdog = createSignedAgreementWatchdog({
    agreementRepo,
    signatureService: deps.signatureService,
    eventBus: deps.eventBus,
    logger: deps.logger,
    intervalMin: deps.env.AGREEMENT_WATCHDOG_INTERVAL_MIN,
    staleThresholdMin: deps.env.AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN,
  });

  const agreementsRouter = createAgreementsRouter(controllers);
  const docusealWebhookRouter = createDocusealWebhookRouter({
    controller: webhookController,
    verifyHmac,
  });

  const initialize = async (): Promise<void> => {
    await initializeAgreementSignedSubscriber({
      eventBus: deps.eventBus,
      finalizeAgreement: finalizeAgreementBound,
      logger: deps.logger,
    });
    watchdog.start();
  };

  const shutdown = (): void => {
    watchdog.stop();
  };

  const queries: AgreementsModuleQueries = {
    findLatestForCarrier: agreementRepo.findLatestForCarrier,
    ensureForCarrier: (input) =>
      ensureAgreementForCarrier(input, {
        agreementRepo,
        orgQueries,
        requestAgreement: requestAgreementBound,
        logger: deps.logger,
      }),
    voidForReSign: (input) =>
      voidForReSign(input, {
        agreementRepo,
        eventBus: deps.eventBus,
        logger: deps.logger,
      }),
    mockSignAgreement: markSigned
      ? (input) =>
          mockSignAgreement(input, {
            agreementRepo,
            markSigned,
            logger: deps.logger,
          })
      : undefined,
  };

  return {
    agreementsRouter,
    docusealWebhookRouter,
    queries,
    initialize,
    shutdown,
  };
};
