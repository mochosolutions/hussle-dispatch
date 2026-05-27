import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@/shared/errors';
import {
  generateCsrfToken,
  setAccessTokenCookie,
  setCsrfTokenCookie,
  setRefreshTokenCookie,
} from '@/shared/utils/cookieUtils';
import { getRefreshTtlSeconds, REFRESH_TTL_BASE_SECONDS } from '../../constants';
import { extractAccessTokenExpAsIso } from '../../providers/jwtTokenProvider/tokenHelpers';
import type { ITokenProvider } from '../../types/tokenProvider';
import { refreshUserTokenService } from '../../services';
import { mapRefreshTokenRequest } from './mappers/mapRefreshTokenRequest';
import { toRefreshTokenSuccessResponse } from './transformers/refreshTokenTransformer';

interface RefreshTokenControllerDeps {
  tokenProviderInstance: ITokenProvider;
}

const decodeSessionId = (accessToken: string): string | null => {
  const decoded = jwt.decode(accessToken) as { sessionId?: string } | null;
  return decoded?.sessionId ?? null;
};

export const createRefreshTokenController = ({
  tokenProviderInstance,
}: RefreshTokenControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const serviceInput = mapRefreshTokenRequest(req);

    if (!serviceInput) {
      throw new UnauthorizedError('No refresh token found');
    }

    const tokens = await refreshUserTokenService(serviceInput, {
      tokenProvider: tokenProviderInstance,
    });

    if (!tokens) {
      throw new UnauthorizedError('Token refresh failed');
    }

    const { accessToken, refreshToken: newRefreshToken } = tokens;

    // Look up the new session to honor rememberMe on the cookie maxAge.
    const sessionId = decodeSessionId(accessToken);
    let refreshMaxAgeMs = REFRESH_TTL_BASE_SECONDS * 1000;
    if (sessionId) {
      const session = await tokenProviderInstance.getSessionById(sessionId);
      const rememberMe = session?.rememberMe === true;
      refreshMaxAgeMs = getRefreshTtlSeconds(rememberMe) * 1000;
    }

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, newRefreshToken, refreshMaxAgeMs);
    setCsrfTokenCookie(res, generateCsrfToken());

    const accessTokenExpiresAt = extractAccessTokenExpAsIso(accessToken);
    return res.status(200).json(toRefreshTokenSuccessResponse(accessTokenExpiresAt));
  };
