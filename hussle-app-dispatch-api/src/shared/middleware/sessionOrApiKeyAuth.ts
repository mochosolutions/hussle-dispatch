import type { Request, Response, NextFunction } from 'express';
import { apiKeyAuth } from './apiKeyAuth';
import { appAuth } from './authenticateUser';

const API_KEY_BEARER_PREFIX = 'Bearer fc_live_';

export const sessionOrApiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = req.headers.authorization;
  if (header?.startsWith(API_KEY_BEARER_PREFIX)) {
    return apiKeyAuth(req, res, next);
  }
  return appAuth(req, res, next);
};
