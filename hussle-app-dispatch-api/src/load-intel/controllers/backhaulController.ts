import type { Request, Response } from 'express';
import { sendSingle } from '../../shared/responseEnvelope';
import type { BackhaulSearchInput, BackhaulSearchResult } from '../types/backhaulTypes';
import { backhaulMapper } from './mappers/backhaulMapper';
import { toBackhaulResponse } from './transformers/backhaulTransformer';

interface BackhaulControllerDeps {
  searchBackhaul: (orgId: string, input: BackhaulSearchInput) => Promise<BackhaulSearchResult>;
}

export const backhaulController = (deps: BackhaulControllerDeps) =>
  async (req: Request, res: Response) => {
    const { orgId, input } = backhaulMapper(req);
    const result = await deps.searchBackhaul(orgId, input);

    res.status(200).json({
      data: toBackhaulResponse(result.data),
      meta: { total: result.total },
    });
  };
