import type { Request } from 'express';
import type { ClearSourceInput, LoadSource } from '../../types/loadBoardTypes';

export const clearSourceMapper = (req: Request): ClearSourceInput => ({
  organizationId: req.organizationId ?? '',
  source: req.params['source'] as LoadSource,
});
