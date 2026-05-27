import type { Request } from 'express';

export const getRequiredPlaceIdMapper = (req: Request): string =>
  req.params['id'] ?? '';
