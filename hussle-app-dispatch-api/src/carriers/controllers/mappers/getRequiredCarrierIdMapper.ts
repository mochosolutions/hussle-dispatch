import type { Request } from 'express';

export const getRequiredCarrierIdMapper = (req: Request): string =>
  req.params['id'] ?? '';
