import type { PrismaClient } from '@prisma/client';

import type { EventBus } from '@/shared/messaging/eventBus';
import { renderDispatchAgreement } from '@/shared/signatures/agreementTemplates/renderDispatchAgreement';
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
import type { FinalizeAgreementInput } from './services/finalizeAgreement';
import { finalizeAgreement } from './services/finalizeAgreement';
import type { RequestAgreementInput } from './services/requestAgreement';
import { requestAgreement } from './services/requestAgreement';
import type { VoidAgreementInput } from './services/voidAgreement';
import { voidAgreement } from './services/voidAgreement';
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
  env: AgreementsModuleEnv;
}

export interface AgreementsModule {
  agreementsRouter: ReturnType<typeof createAgreementsRouter>;
  docusealWebhookRouter: ReturnType<typeof createDocusealWebhookRouter>;
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

  const requestAgreementBound = (
    input: RequestAgreementInput,
  ): Promise<AgreementServiceResult<Agreement>> =>
    requestAgreement(input, {
      agreementRepo,
      signatureService: deps.signatureService,
      renderDispatchAgreement,
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

  return {
    agreementsRouter,
    docusealWebhookRouter,
    initialize,
    shutdown,
  };
};
