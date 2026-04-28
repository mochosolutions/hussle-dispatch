import type { Request, Response, NextFunction } from 'express';
import type { ApiKeyService } from '@/api-keys/services/apiKeyService';

const BEARER_PREFIX = 'Bearer fc_live_';

export const createApiKeyAuth =
  (apiKeyService: ApiKeyService) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header?.startsWith(BEARER_PREFIX)) {
      res.status(401).json({ errors: [{ message: 'Missing or malformed API key' }] });
      return;
    }

    const key = header.slice('Bearer '.length);
    const result = await apiKeyService.verify(key);
    if (!result) {
      res.status(401).json({ errors: [{ message: 'Invalid or revoked API key' }] });
      return;
    }

    req.organizationId = result.organizationId;
    req.authMethod = 'apiKey';
    next();
  };

let cached: ((req: Request, res: Response, next: NextFunction) => Promise<void>) | null = null;

const getApiKeyAuth = async (): Promise<
  (req: Request, res: Response, next: NextFunction) => Promise<void>
> => {
  if (!cached) {
    const { apiKeyService } = await import('@/api-keys');
    cached = createApiKeyAuth(apiKeyService);
  }
  return cached;
};

export const apiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const middleware = await getApiKeyAuth();
  return middleware(req, res, next);
};
