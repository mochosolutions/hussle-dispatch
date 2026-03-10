import type { Request, Response } from 'express';
import { sendSingle } from '../../shared/responseEnvelope';
import type { LoadChain } from '../types/backhaulTypes';
import { chainMapper } from './mappers/backhaulMapper';
import { toChainResponse } from './transformers/backhaulTransformer';

interface ChainControllerDeps {
  assembleChain: (
    orgId: string,
    loadHash: string,
    vehicleId: string,
    limit: number,
  ) => Promise<LoadChain[]>;
}

export const chainController = (deps: ChainControllerDeps) =>
  async (req: Request, res: Response) => {
    const { orgId, loadHash, vehicleId, limit } = chainMapper(req);
    const chains = await deps.assembleChain(orgId, loadHash, vehicleId, limit);
    sendSingle(res, toChainResponse(chains));
  };
