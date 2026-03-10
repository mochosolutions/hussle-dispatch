import type { Request, Response } from 'express';
import type { MarketSnapshot } from '../types/loadIntelTypes';
import { getMarketDataMapper } from './mappers/getMarketDataMapper';
import { marketSnapshotTransformer } from './transformers/marketSnapshotTransformer';
import { sendSingle } from '../../shared/responseEnvelope';

interface GetMarketDataControllerDeps {
  getMarketSnapshot: (state: string, city: string) => Promise<MarketSnapshot>;
}

export const getMarketDataController = (deps: GetMarketDataControllerDeps) =>
  async (req: Request, res: Response) => {
    const { state, city } = getMarketDataMapper(req);
    const snapshot = await deps.getMarketSnapshot(state, city);
    const transformed = marketSnapshotTransformer(snapshot);

    sendSingle(res, transformed);
  };
