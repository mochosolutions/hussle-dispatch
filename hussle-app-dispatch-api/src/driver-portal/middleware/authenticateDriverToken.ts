import type { Request, Response, NextFunction } from 'express';
import type { TrackingTokenRepoPort } from '@/notifications/types/trackingTokenTypes';

interface AuthenticateDriverTokenDeps {
  tokenRepo: TrackingTokenRepoPort;
}

export const createAuthenticateDriverToken = (deps: AuthenticateDriverTokenDeps) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({ errors: [{ message: 'Missing driver portal token' }] });
      return;
    }

    const tokenRecord = await deps.tokenRepo.findByToken(token);

    if (tokenRecord === null) {
      res.status(401).json({ errors: [{ message: 'Invalid driver portal token' }] });
      return;
    }

    if (tokenRecord.type !== 'DRIVER') {
      res.status(401).json({ errors: [{ message: 'Invalid driver portal token' }] });
      return;
    }

    if (tokenRecord.revokedAt !== null) {
      res.status(401).json({ errors: [{ message: 'Driver portal link has been revoked' }] });
      return;
    }

    if (tokenRecord.expiresAt < new Date()) {
      res.status(401).json({ errors: [{ message: 'Driver portal link has expired' }] });
      return;
    }

    req.driverPortal = {
      loadId: tokenRecord.loadId,
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
