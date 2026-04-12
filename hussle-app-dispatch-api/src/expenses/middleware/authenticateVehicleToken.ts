import type { Request, Response, NextFunction } from 'express';
import type { TrackingTokenRepoPort } from '@/notifications/types/trackingTokenTypes';

interface AuthenticateVehicleTokenDeps {
  tokenRepo: TrackingTokenRepoPort;
}

export const createAuthenticateVehicleToken = (deps: AuthenticateVehicleTokenDeps) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({ errors: [{ message: 'Missing vehicle expense token' }] });
      return;
    }

    const tokenRecord = await deps.tokenRepo.findByToken(token);

    if (tokenRecord === null) {
      res.status(401).json({ errors: [{ message: 'Invalid vehicle expense token' }] });
      return;
    }

    if (tokenRecord.type !== 'VEHICLE') {
      res.status(401).json({ errors: [{ message: 'Invalid vehicle expense token' }] });
      return;
    }

    if (tokenRecord.revokedAt !== null) {
      res.status(401).json({ errors: [{ message: 'Vehicle expense link has been revoked' }] });
      return;
    }

    if (tokenRecord.expiresAt < new Date()) {
      res.status(401).json({ errors: [{ message: 'Vehicle expense link has expired' }] });
      return;
    }

    if (!tokenRecord.vehicleId) {
      res.status(401).json({ errors: [{ message: 'Invalid vehicle expense token' }] });
      return;
    }

    req.vehicleExpense = {
      vehicleId: tokenRecord.vehicleId,
      driverId: tokenRecord.driverId ?? null,
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
