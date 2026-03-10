import type { Request, Response } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { RequestHandler } from 'express';
import type { LoadService } from '../types/loadServiceTypes';
import { createLoadMapper } from './mappers/createLoadMapper';
import { getRequiredLoadIdMapper } from './mappers/getRequiredLoadIdMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { listLoadsMapper } from './mappers/listLoadsMapper';
import { updateLoadMapper } from './mappers/updateLoadMapper';
import { createCheckCallMapper } from './mappers/createCheckCallMapper';
import { loadSubResourceMapper } from './mappers/loadSubResourceMapper';
import {
  toLoadDetailResponse,
  toLoadListEnvelope,
} from './transformers/loadTransformer';
import { toCheckCallResponse, toCheckCallListResponse } from './transformers/checkCallTransformer';
import { toStatusHistoryListResponse } from './transformers/statusHistoryTransformer';
import { toLoadDocumentListResponse } from './transformers/loadDocumentTransformer';

interface LoadControllerDeps {
  loadService: LoadService;
}

export interface LoadControllers {
  createLoad: RequestHandler;
  listLoads: RequestHandler;
  getLoadById: RequestHandler;
  updateLoad: RequestHandler;
  deleteLoad: RequestHandler;
  createCheckCall: RequestHandler;
  listCheckCalls: RequestHandler;
  listStatusHistory: RequestHandler;
  listLoadDocuments: RequestHandler;
}

export const createLoadControllers = (deps: LoadControllerDeps): LoadControllers => ({
  createLoad: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createLoadMapper(req);
    const load = await deps.loadService.createLoad(serviceInput);
    sendSingle(res, toLoadDetailResponse(load), 201);
  },

  listLoads: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = listLoadsMapper(req);
    const result = await deps.loadService.listLoads(serviceInput);
    const response = toLoadListEnvelope(result.data, result.meta);
    sendList(res, { data: response.data, meta: response.meta });
  },

  getLoadById: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredLoadIdMapper(req);
    const load = await deps.loadService.getLoadById({
      ...context,
      id,
    });
    sendSingle(res, toLoadDetailResponse(load));
  },

  updateLoad: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = updateLoadMapper(req);
    const load = await deps.loadService.updateLoad(serviceInput);
    sendSingle(res, toLoadDetailResponse(load));
  },

  deleteLoad: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredLoadIdMapper(req);
    await deps.loadService.deleteLoad({
      ...context,
      id,
    });
    res.status(204).send();
  },

  createCheckCall: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createCheckCallMapper(req);
    const checkCall = await deps.loadService.createCheckCall(serviceInput);
    sendSingle(res, toCheckCallResponse(checkCall), 201);
  },

  listCheckCalls: async (req: Request, res: Response): Promise<void> => {
    const context = loadSubResourceMapper(req);
    const checkCalls = await deps.loadService.listCheckCalls(context);
    sendSingle(res, toCheckCallListResponse(checkCalls));
  },

  listStatusHistory: async (req: Request, res: Response): Promise<void> => {
    const context = loadSubResourceMapper(req);
    const history = await deps.loadService.listStatusHistory(context);
    sendSingle(res, toStatusHistoryListResponse(history));
  },

  listLoadDocuments: async (req: Request, res: Response): Promise<void> => {
    const context = loadSubResourceMapper(req);
    const documents = await deps.loadService.listLoadDocuments(context);
    sendSingle(res, toLoadDocumentListResponse(documents));
  },
});
