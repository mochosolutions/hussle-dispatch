import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { UnauthorizedError } from '@/shared/errors';
import {
  generateCsrfToken,
  setAccessTokenCookie,
  setCsrfTokenCookie,
  setRefreshTokenCookie,
} from '@/shared/utils/cookieUtils';
import type { ITokenProvider } from '../../types/tokenProvider';
import { refreshUserTokenService } from '../../services';
import { mapRefreshTokenRequest } from './mappers/mapRefreshTokenRequest';
import { toRefreshTokenSuccessResponse } from './transformers/refreshTokenTransformer';

interface RefreshTokenControllerDeps {
  tokenProviderInstance: ITokenProvider;
}

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

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, newRefreshToken);
    setCsrfTokenCookie(res, generateCsrfToken());

    return res.status(200).json(toRefreshTokenSuccessResponse());
  };
