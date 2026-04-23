import type { Request } from 'express';
import type { FeedServiceInput, LoadSource } from '../../types/loadBoardTypes';

export const getFeedMapper = (req: Request): FeedServiceInput => ({
  organizationId: req.organizationId ?? '',
  source: req.query['source'] as LoadSource | undefined,
});
