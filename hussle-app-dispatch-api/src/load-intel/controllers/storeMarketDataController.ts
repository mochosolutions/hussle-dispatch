import type { Request, Response } from 'express';
import type { MarketSnapshot } from '../types/loadIntelTypes';
import { storeMarketDataMapper } from './mappers/storeMarketDataMapper';
import { marketSnapshotTransformer } from './transformers/marketSnapshotTransformer';
import { sendSingle } from '../../shared/responseEnvelope';

interface StoreMarketDataControllerDeps {
  storeMarketSnapshot: (input: {
    state: string;
    city: string;
    loadToTruckRatio: number;
  }) => Promise<MarketSnapshot>;
}

export const storeMarketDataController = (deps: StoreMarketDataControllerDeps) =>
  async (req: Request, res: Response) => {
    const input = storeMarketDataMapper(req);
    const snapshot = await deps.storeMarketSnapshot(input);
    const transformed = marketSnapshotTransformer(snapshot);

    sendSingle(res, transformed, 201);
  };
