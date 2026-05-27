import type { Request } from 'express';
import type { RefreshTokenInput } from '../../../services/auth/refreshUserTokenService';

export const mapRefreshTokenRequest = (req: Request): RefreshTokenInput | null => {
  const refreshToken = req.cookies?.refreshToken;

  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    return null;
  }

  return {
    refreshToken,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
};
