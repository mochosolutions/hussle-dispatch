import type { NextFunction, Request, Response } from 'express';
import { redisClient as redis } from '@/shared/redisClient';
import { logger } from '@/shared/utils/logger';
import { prisma } from '@/shared/prisma';
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/shared/utils/cookieUtils';
import { tokenProvider } from '../../providers/tokenProvider';
import { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';
import { switchOrgService } from '../../services';

export const switchOrgController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId, sessionId } = user;
    const { organizationId } = req.body;
    const tokenProviderInstance = tokenProvider({ client: redis });
    const userRepo = userRepositoryPrisma(prisma);

    const currentRefreshToken = req.cookies?.refreshToken;
    // Call the use case
    const result = await switchOrgService(
      {
        organizationId,
        userId,
        sessionId: sessionId ?? '',
        refreshToken: currentRefreshToken,
      },
      {
        tokenProvider: tokenProviderInstance,
        findUserByIdWithMemberships: userRepo.findUserByIdWithMemberships,
      }
    );

    if (!result) {
      return res.status(404).json({ error: 'Organization not found or user not a member' });
    }

    const { user: formattedUser, orgs, accessToken, refreshToken } = result;

    logger.info('Org switch completed, setting tokens');

    // Set both tokens as HttpOnly cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    // Return the response
    return res.status(200).json({
      message: 'success',
      user: formattedUser,
      accessibleOrgs: orgs,
    });
  } catch (error) {
    return next(error);
  }
};
