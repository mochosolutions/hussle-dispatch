import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { RankDriversInput, RankedDriver } from '../types/rankDriverTypes';
import { rankDriversMapper } from './mappers/rankDriversMapper';
import { toRankedDriverListResponse } from './transformers/rankDriversTransformer';

interface RankDriversControllerDeps {
  rankDrivers: (input: RankDriversInput) => Promise<RankedDriver[]>;
}

export const rankDriversController = (deps: RankDriversControllerDeps): RequestHandler =>
  async (req: Request, res: Response): Promise<void> => {
    const input = rankDriversMapper(req);
    const results = await deps.rankDrivers(input);
    const response = toRankedDriverListResponse(results);
    sendSingle(res, response);
  };
