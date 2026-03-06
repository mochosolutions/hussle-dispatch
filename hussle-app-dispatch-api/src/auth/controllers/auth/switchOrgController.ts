import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { logger } from '@/shared/utils/logger';
import { UnauthorizedError } from '@/shared/errors';
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/shared/utils/cookieUtils';
import type { ITokenProvider } from '../../types/tokenProvider';
import type { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';
import { switchOrgService } from '../../services';
import { mapSwitchOrgRequest } from './mappers/mapSwitchOrgRequest';
import { toSwitchOrgResponse } from './transformers/switchOrgTransformer';

interface SwitchOrgControllerDeps {
  userRepo: Pick<ReturnType<typeof userRepositoryPrisma>, 'findUserByIdWithMemberships'>;
  tokenProviderInstance: ITokenProvider;
}

export const createSwitchOrgController = ({
  userRepo,
  tokenProviderInstance,
}: SwitchOrgControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const serviceInput = mapSwitchOrgRequest(req);

    if (!serviceInput) {
      throw new UnauthorizedError('Unauthorized');
    }

    const result = await switchOrgService(serviceInput, {
      tokenProvider: tokenProviderInstance,
      findUserByIdWithMemberships: userRepo.findUserByIdWithMemberships,
    });

    logger.info('Org switch completed, setting tokens');

    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);

    return res.status(200).json(toSwitchOrgResponse(result));
  };

