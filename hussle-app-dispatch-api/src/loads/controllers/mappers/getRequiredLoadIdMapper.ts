import type { Request } from 'express';

export const getRequiredLoadIdMapper = (req: Request): string =>
  req.params['id'] ?? '';
