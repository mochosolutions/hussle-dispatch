import type { Request } from 'express';
import type { FeedDetailInput } from '../../types/loadBoardTypes';

export const getLoadDetailMapper = (req: Request): FeedDetailInput => ({
  organizationId: req.organizationId ?? '',
  id: req.params['id'] ?? '',
});
