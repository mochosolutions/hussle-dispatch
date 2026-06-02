import type { PrismaClient } from '@prisma/client';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { PrismaTransaction as AuthPrismaTransaction } from '@/shared/prisma';
import { getClientId, cognitoIdentityClient } from '@/shared/utils/cognito';
import { cognitoProvider } from '@/auth/providers/authProvider';
import { userRepositoryPrisma } from '@/auth/repositories/userRepositoryPrisma';
import { membershipRepositoryPrisma } from '@/auth/repositories/membershipRepositoryPrisma';
import { organizationRepositoryPrisma } from '@/auth/repositories/organizationRepositoryPrisma';
import type { ITokenProvider } from '@/auth/types/tokenProvider';
import { MembershipStatus } from '@/auth/constants/enums';
import type { TrackingTokenService } from '../notifications/services/trackingTokenService';
import type { LoadStatusService } from '../loads/services/loadStatusService';
import type { DocumentService } from '../documents/types/documentServiceTypes';
import type { TrackingTokenRepoPort } from '../notifications/types/trackingTokenTypes';
import { driverPortalLoadQueryPrisma } from './repositories/driverPortalLoadQueryPrisma';
import { driverPortalCheckCallRepositoryPrisma } from './repositories/driverPortalCheckCallRepositoryPrisma';
import { driverAuthRepoPrisma } from './repositories/driverAuthRepoPrisma';
import { driverInviteTokenRepoPrisma } from './repositories/driverInviteTokenRepoPrisma';
import { createDriverPortalService } from './services/driverPortalService';
import { inviteDriverService } from './services/inviteDriverService';
import { acceptDriverInviteService } from './services/acceptDriverInviteService';
import { createGetDriverPortalLinkController } from './controllers/getDriverPortalLinkController';
import { createDriverPortalControllers } from './controllers/driverPortalController';
import { createInviteDriverController } from './controllers/inviteDriverController';
import { createAcceptDriverInviteController } from './controllers/acceptDriverInviteController';
import { createAuthenticateDriverToken } from './middleware/authenticateDriverToken';
import { createAuthenticateDriverSession } from './middleware/authenticateDriverSession';

interface DriverPortalModuleDeps {
  prismaClient: PrismaClient;
  eventBus: EventBus;
  logger: Logger;
  trackingBaseUrl: string;
  frontendUrl: string;
  trackingTokenService: TrackingTokenService;
  loadStatusService: LoadStatusService;
  documentService: DocumentService;
  tokenRepo: TrackingTokenRepoPort;
  tokenProviderInstance: ITokenProvider;
  transactionManager: {
    runInTransaction: <T>(fn: (tx: AuthPrismaTransaction) => Promise<T>) => Promise<T>;
  };
}

export const createDriverPortalModule = (deps: DriverPortalModuleDeps) => {
  const loadQuery = driverPortalLoadQueryPrisma(deps.prismaClient);
  const checkCallRepo = driverPortalCheckCallRepositoryPrisma(deps.prismaClient);
  const driverAuthRepo = driverAuthRepoPrisma(deps.prismaClient);
  const inviteTokenRepo = driverInviteTokenRepoPrisma(deps.prismaClient);

  const driverPortalService = createDriverPortalService({
    loadQuery,
    checkCallRepo,
    loadStatusService: deps.loadStatusService,
    eventBus: deps.eventBus,
    logger: deps.logger,
  });

  const authenticateDriverToken = createAuthenticateDriverToken({
    tokenRepo: deps.tokenRepo,
  });

  const authenticateDriverSession = createAuthenticateDriverSession({
    driverAuthRepo,
  });

  // Lazily builds the Cognito-backed auth provider per accept (mirrors
  // acceptInviteController) since pool/client ids are resolved at request time.
  const acceptDriverInvite = async (input: Parameters<typeof acceptDriverInviteService>[0]) => {
    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });

    return acceptDriverInviteService(input, {
      transactionManager: deps.transactionManager,
      authProvider,
      logger: deps.logger,
      findTokenByToken: async (token, tx) => driverInviteTokenRepoPrisma(tx).findByToken(token),
      findDriverAuthInfo: async (driverId, tx) =>
        driverAuthRepoPrisma(tx).findDriverAuthInfo(driverId),
      findOrganizationById: async (id, tx) => {
        const org = await organizationRepositoryPrisma(tx).findOrganizationById(id);
        if (org === null) {
          return null;
        }
        return {
          id: org.id,
          slug: org.slug,
          status: org.status ?? '',
          subscriptionTier: org.subscriptionTier ?? '',
        };
      },
      createUser: async (data, tx) => {
        const userRepo = userRepositoryPrisma(tx);
        return userRepo.createUser(data);
      },
      createMembership: async (data, tx) => {
        const membershipRepo = membershipRepositoryPrisma(tx);
        const membership = await membershipRepo.create({
          userId: data.userId,
          organizationId: data.organizationId,
          role: data.role,
          status: MembershipStatus.ACTIVE,
        });
        return { membershipId: membership.membershipId };
      },
      linkDriverUser: async (driverId, userId, tx) =>
        driverAuthRepoPrisma(tx).linkUser(driverId, userId),
      markTokenAccepted: async (id, acceptedAt, tx) =>
        driverInviteTokenRepoPrisma(tx).markAccepted(id, acceptedAt),
    });
  };

  const controllers = {
    getDriverPortalLink: createGetDriverPortalLinkController({
      loadQuery,
      trackingTokenService: deps.trackingTokenService,
      logger: deps.logger,
      trackingBaseUrl: deps.trackingBaseUrl,
    }),
    inviteDriver: createInviteDriverController({
      inviteDriver: (input) =>
        inviteDriverService(input, {
          driverAuthRepo,
          inviteTokenRepo,
          frontendUrl: deps.frontendUrl,
          logger: deps.logger,
          eventBus: deps.eventBus,
        }),
    }),
    acceptDriverInvite: createAcceptDriverInviteController({
      acceptDriverInvite,
      tokenProviderInstance: deps.tokenProviderInstance,
    }),
    portal: createDriverPortalControllers({
      driverPortalService,
      documentService: deps.documentService,
    }),
  };

  const middleware = {
    authenticateDriverToken,
    authenticateDriverSession,
  };

  return { controllers, middleware };
};
