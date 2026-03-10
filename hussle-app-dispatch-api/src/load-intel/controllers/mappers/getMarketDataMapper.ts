import type { Request } from 'express';

export const getMarketDataMapper = (req: Request): { state: string; city: string } => ({
  state: req.params['state'] ?? '',
  city: req.params['city'] ?? '',
});
