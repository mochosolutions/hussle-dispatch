import type { Request } from 'express';
import type { FeedServiceInput, LoadSource } from '../../types/loadBoardTypes';

// TODO: restore req.organizationId once auth is re-enabled on feed route
const DEV_ORG_ID = '69656852-4642-4696-9ef7-dd66288afd8e';

export const getFeedMapper = (req: Request): FeedServiceInput => ({
  organizationId: req.organizationId ?? DEV_ORG_ID,
  source: req.query['source'] as LoadSource | undefined,
});
