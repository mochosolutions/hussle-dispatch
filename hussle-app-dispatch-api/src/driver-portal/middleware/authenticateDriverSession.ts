import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { ROLES } from '@/config/roles';
import { requireAuth, requireRole } from '@/middleware/auth';

import type { DriverAuthRepoPort } from '../types/driverAuthTypes';

interface AuthenticateDriverSessionDeps {
  driverAuthRepo: DriverAuthRepoPort;
}

const requireDriverRole = requireRole([ROLES.DRIVER]);

/**
 * Driver portal session guard. Requires a real authenticated session — a bare
 * `?token=` with no `accessToken` cookie is rejected by `requireAuth` (401).
 * The user must hold the DRIVER role (so ADMIN/DISPATCHER sessions never read
 * the driver portal, and DRIVER sessions never satisfy internal ADMIN/DISPATCHER
 * routes). Resolves the Driver.id from Driver.userId and sets `req.driverId`.
 */
export const createAuthenticateDriverSession = (
  deps: AuthenticateDriverSessionDeps,
): RequestHandler => {
  const resolveDriverId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const userId = req.user?.userId;
    if (userId === undefined) {
      res.status(401).json({ errors: [{ message: 'Authentication required' }] });
      return;
    }

    const driverId = await deps.driverAuthRepo.findDriverIdByUserId(userId);
    if (driverId === null) {
      res.status(403).json({ errors: [{ message: 'No driver profile linked to this account' }] });
      return;
    }

    req.driverId = driverId;
    next();
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    requireAuth(req, res, (authErr?: unknown) => {
      if (authErr !== undefined) {
        next(authErr);
        return;
      }
      requireDriverRole(req, res, (roleErr?: unknown) => {
        if (roleErr !== undefined) {
          next(roleErr);
          return;
        }
        resolveDriverId(req, res, next).catch(next);
      });
    });
  };
};
