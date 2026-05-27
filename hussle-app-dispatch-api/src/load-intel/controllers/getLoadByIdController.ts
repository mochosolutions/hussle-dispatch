import type { Request, Response } from 'express';
import type { LoadIntelRedis } from '../types/loadIntelTypes';
import { getLoadByIdMapper } from './mappers/getLoadByIdMapper';
import { loadIntelTransformer } from './transformers/loadIntelTransformer';
import { sendSingle } from '../../shared/responseEnvelope';

interface GetLoadByIdControllerDeps {
  getLoadById: (orgId: string, loadHash: string) => Promise<LoadIntelRedis>;
}

export const getLoadByIdController = (deps: GetLoadByIdControllerDeps) =>
  async (req: Request, res: Response) => {
    const { orgId, loadHash } = getLoadByIdMapper(req);
    const record = await deps.getLoadById(orgId, loadHash);
    const transformed = loadIntelTransformer(record);

    sendSingle(res, transformed);
  };
