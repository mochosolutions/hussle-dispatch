import type { Request, RequestHandler, Response } from 'express';

import {
  generateCsrfToken,
  setAccessTokenCookie,
  setCsrfTokenCookie,
  setRefreshTokenCookie,
} from '@/shared/utils/cookieUtils';
import { extractAccessTokenExpAsIso } from '@/auth/providers/jwtTokenProvider/tokenHelpers';
import type { ITokenProvider } from '@/auth/types/tokenProvider';
import { REFRESH_TTL_BASE_SECONDS } from '@/auth/constants';

import type {
  AcceptDriverInviteInput,
  AcceptDriverInviteResult,
} from '../services/acceptDriverInviteService';

interface AcceptDriverInviteControllerDeps {
  acceptDriverInvite: (input: AcceptDriverInviteInput) => Promise<AcceptDriverInviteResult>;
  tokenProviderInstance: ITokenProvider;
}

const acceptDriverInviteMapper = (req: Request): AcceptDriverInviteInput => {
  const body = req.body as { password?: string; email?: string };
  return {
    token: req.params['token'] ?? '',
    password: body.password ?? '',
    email: body.email,
  };
};

export const createAcceptDriverInviteController = (
  deps: AcceptDriverInviteControllerDeps,
): RequestHandler =>
  async (req: Request, res: Response) => {
    const input = acceptDriverInviteMapper(req);

    const result = await deps.acceptDriverInvite(input);

    const { accessToken, refreshToken } = await deps.tokenProviderInstance.createSession({
      userId: result.userId,
      organizationId: result.organizationId,
      orgSlug: result.orgSlug,
      membershipId: result.membershipId,
      role: result.role,
      orgSubscriptionTier: result.orgSubscriptionTier,
      orgStatus: result.orgStatus,
    });

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken, REFRESH_TTL_BASE_SECONDS * 1000);
    setCsrfTokenCookie(res, generateCsrfToken());

    const accessTokenExpiresAt = extractAccessTokenExpAsIso(accessToken);

    return res.status(201).json({
      message: 'Driver account setup successful',
      driverId: result.driverId,
      userId: result.userId,
      organizationId: result.organizationId,
      role: result.role,
      accessTokenExpiresAt,
    });
  };
