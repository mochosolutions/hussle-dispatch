import type { Request } from 'express';
import type { RankDriversInput } from '../../types/rankDriverTypes';

export const rankDriversMapper = (req: Request): RankDriversInput => ({
  loadId: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
});
