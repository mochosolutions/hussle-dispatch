import type { Request } from 'express';
import type { IngestServiceInput, LoadSource } from '../../types/loadBoardTypes';

// TODO: restore req.organizationId once auth is re-enabled on ingest route
const DEV_ORG_ID = '69656852-4642-4696-9ef7-dd66288afd8e';

export const ingestMapper = (req: Request): IngestServiceInput => ({
  organizationId: req.organizationId ?? DEV_ORG_ID,
  source: req.body.source as LoadSource,
  loads: req.body.loads as Record<string, unknown>[],
});
