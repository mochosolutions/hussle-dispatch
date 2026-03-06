import type { Request } from 'express';
import type { SwitchOrgInput } from '../../../services/auth/switchOrgService';

export const mapSwitchOrgRequest = (req: Request): SwitchOrgInput | null => {
  const authenticatedUser = req.user;
  const organizationId = req.body?.organizationId;
  const refreshToken = req.cookies?.refreshToken;

  if (!authenticatedUser) {
    return null;
  }

  if (typeof organizationId !== 'string' || organizationId.length === 0) {
    return null;
  }

  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    return null;
  }

  return {
    organizationId,
    userId: authenticatedUser.userId,
    sessionId: authenticatedUser.sessionId,
    refreshToken,
  };
};
