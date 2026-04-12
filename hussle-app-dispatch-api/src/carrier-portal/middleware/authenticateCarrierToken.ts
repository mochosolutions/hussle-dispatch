import type { Request, Response, NextFunction } from 'express';
import type { CarrierInviteTokenRepoPort } from '@/carrier-portal/types/carrierInviteTokenRepoPort';

interface AuthenticateCarrierTokenDeps {
  tokenRepo: CarrierInviteTokenRepoPort;
}

export const createAuthenticateCarrierToken = (deps: AuthenticateCarrierTokenDeps) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({ errors: [{ message: 'Invalid or expired carrier portal token' }] });
      return;
    }

    const tokenRecord = await deps.tokenRepo.findByToken(token);

    if (tokenRecord === null) {
      res.status(401).json({ errors: [{ message: 'Invalid or expired carrier portal token' }] });
      return;
    }

    req.carrierPortal = {
      carrierId: tokenRecord.carrierId,
      organizationId: tokenRecord.organizationId,
      tokenId: tokenRecord.id,
    };

    next();
  };

const extractToken = (req: Request): string | null => {
  const queryToken = req.query['token'];
  if (typeof queryToken === 'string' && queryToken.length > 0) {
    return queryToken;
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
};
