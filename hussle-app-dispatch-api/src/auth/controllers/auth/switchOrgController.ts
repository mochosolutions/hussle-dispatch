import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { logger } from '@/shared/utils/logger';
import { UnauthorizedError } from '@/shared/errors';
import {
  generateCsrfToken,
  setAccessTokenCookie,
  setCsrfTokenCookie,
  setRefreshTokenCookie,
} from '@/shared/utils/cookieUtils';
import type { CreateAuditLogInput } from '../../types/auditLogPort';
import type { ITokenProvider } from '../../types/tokenProvider';
import type { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';
import { switchOrgService } from '../../services';
import { mapSwitchOrgRequest } from './mappers/mapSwitchOrgRequest';
import { toSwitchOrgResponse } from './transformers/switchOrgTransformer';

interface SwitchOrgControllerDeps {
  userRepo: Pick<ReturnType<typeof userRepositoryPrisma>, 'findUserByIdWithMemberships'>;
  tokenProviderInstance: ITokenProvider;
  auditLogRepo: {
    create: (organizationId: string, input: CreateAuditLogInput) => Promise<unknown>;
  };
}

export const createSwitchOrgController = ({
  userRepo,
  tokenProviderInstance,
  auditLogRepo,
}: SwitchOrgControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const serviceInput = mapSwitchOrgRequest(req);

    if (!serviceInput) {
      throw new UnauthorizedError('Unauthorized');
    }

    const previousOrgId = req.user?.organizationId;

    const result = await switchOrgService(serviceInput, {
      tokenProvider: tokenProviderInstance,
      findUserByIdWithMemberships: userRepo.findUserByIdWithMemberships,
    });

    logger.info('Org switch completed, setting tokens');

    if (serviceInput.userId && serviceInput.organizationId) {
      auditLogRepo
        .create(serviceInput.organizationId, {
          userId: serviceInput.userId,
          action: 'ORG_SWITCH',
          entityType: 'User',
          entityId: serviceInput.userId,
          changes: null,
          metadata: {
            fromOrganizationId: previousOrgId,
            toOrganizationId: serviceInput.organizationId,
            ip: req.ip,
          },
        })
        .catch(() => {});
    }

    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);
    setCsrfTokenCookie(res, generateCsrfToken());

    return res.status(200).json(toSwitchOrgResponse(result));
  };

