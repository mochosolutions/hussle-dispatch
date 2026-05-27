import type { Request } from 'express';

export const getRequiredCustomerIdMapper = (req: Request): string =>
  req.params['id'] ?? '';
