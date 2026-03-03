import type { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidInviteToken = (token: string): boolean => UUID_REGEX.test(token);

export const createRequireAuthOrInviteToken =
  (appAuthMiddleware: ExpressMiddleware): ExpressMiddleware =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { invitationToken } = req.query;

    if (typeof invitationToken === 'string' && isValidInviteToken(invitationToken)) {
      logger.debug('Auth-or-invite: proceeding with invitation token', {
        correlationId: req.correlationId,
      });
      next();
      return;
    }

    appAuthMiddleware(req, res, next);
  };

import { appAuth } from '@/shared/middleware/authenticateUser';

export const requireAuthOrInviteToken = createRequireAuthOrInviteToken(appAuth);
