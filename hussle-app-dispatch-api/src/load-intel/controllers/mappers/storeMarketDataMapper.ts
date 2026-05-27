import type { Request } from 'express';

interface StoreMarketDataInput {
  state: string;
  city: string;
  loadToTruckRatio: number;
}

export const storeMarketDataMapper = (req: Request): StoreMarketDataInput => ({
  state: req.body.state,
  city: req.body.city,
  loadToTruckRatio: req.body.loadToTruckRatio,
});
