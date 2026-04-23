import type { Request } from 'express';
import type { IngestServiceInput, LoadSource } from '../../types/loadBoardTypes';

export const ingestMapper = (req: Request): IngestServiceInput => ({
  organizationId: req.organizationId ?? '',
  source: req.body.source as LoadSource,
  loads: req.body.loads as Record<string, unknown>[],
});
