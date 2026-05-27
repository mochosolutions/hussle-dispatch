import type { Request, Response } from 'express';
import type { LoadIntelRedis, FeedQueryParams } from '../types/loadIntelTypes';
import { getFeedMapper } from './mappers/getFeedMapper';
import { loadIntelTransformer } from './transformers/loadIntelTransformer';

interface FeedResult {
  data: LoadIntelRedis[];
  meta: { total: number; page: number; limit: number };
}

interface GetFeedControllerDeps {
  getFeed: (orgId: string, params: FeedQueryParams) => Promise<FeedResult>;
}

export const getFeedController = (deps: GetFeedControllerDeps) =>
  async (req: Request, res: Response) => {
    const { orgId, params } = getFeedMapper(req);
    const result = await deps.getFeed(orgId, params);

    const transformed = result.data.map(loadIntelTransformer);

    res.status(200).json({
      data: transformed,
      meta: result.meta,
    });
  };
