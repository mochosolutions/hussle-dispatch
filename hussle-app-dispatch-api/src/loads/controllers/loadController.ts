import type { Request, Response } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { RequestHandler } from 'express';
import type { LoadService } from '../types/loadServiceTypes';
import type {
  UpdateDispatchTermsInput,
  UpdateDispatchTermsResult,
} from '../services/updateDispatchTermsService';
import { dispatchTermsMapper } from './mappers/dispatchTermsMapper';
import { createLoadMapper } from './mappers/createLoadMapper';
import { getRequiredLoadIdMapper } from './mappers/getRequiredLoadIdMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { listLoadsMapper } from './mappers/listLoadsMapper';
import { assignLoadMapper } from './mappers/assignLoadMapper';
import { updateLoadMapper } from './mappers/updateLoadMapper';
import { createCheckCallMapper } from './mappers/createCheckCallMapper';
import { loadSubResourceMapper } from './mappers/loadSubResourceMapper';
import { toLoadDetailResponse, toLoadListEnvelope } from './transformers/loadTransformer';
import { toCheckCallResponse, toCheckCallListResponse } from './transformers/checkCallTransformer';
import { toStatusHistoryListResponse } from './transformers/statusHistoryTransformer';
import { toLoadDocumentListResponse } from './transformers/loadDocumentTransformer';

interface LoadControllerDeps {
  loadService: LoadService;
  updateDispatchTerms: (input: UpdateDispatchTermsInput) => Promise<UpdateDispatchTermsResult>;
}

export interface LoadControllers {
  createLoad: RequestHandler;
  listLoads: RequestHandler;
  getLoadById: RequestHandler;
  updateLoad: RequestHandler;
  updateDispatchTerms: RequestHandler;
  assignLoad: RequestHandler;
  deleteLoad: RequestHandler;
  createCheckCall: RequestHandler;
  listCheckCalls: RequestHandler;
  listStatusHistory: RequestHandler;
  listLoadDocuments: RequestHandler;
}

export const createLoadControllers = (deps: LoadControllerDeps): LoadControllers => ({
  createLoad: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createLoadMapper(req);
    const result = await deps.loadService.createLoad(serviceInput);
    res.status(201).json({
      data: toLoadDetailResponse(result.load),
      warnings: result.warnings,
    });
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
    // Documents drive computeInvoiceReadiness (US-11). Fetched once per detail
    // call — the listing endpoint deliberately skips this to avoid N+1.
    const documents = await deps.loadService.listLoadDocuments({
      loadId: id,
      organizationId: context.organizationId,
    });
    sendSingle(res, toLoadDetailResponse(load, { documents }));
  },

  updateLoad: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = updateLoadMapper(req);
    const result = await deps.loadService.updateLoad(serviceInput);
    res.status(200).json({
      data: toLoadDetailResponse(result.load),
      warnings: result.warnings,
    });
  },

  updateDispatchTerms: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = dispatchTermsMapper(req);
    const result = await deps.updateDispatchTerms(serviceInput);
    sendSingle(res, toLoadDetailResponse(result.load));
  },

  assignLoad: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = assignLoadMapper(req);
    const result = await deps.loadService.assignLoad(serviceInput);
    sendSingle(res, {
      load: toLoadDetailResponse(result.load),
      warnings: result.warnings,
    });
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
