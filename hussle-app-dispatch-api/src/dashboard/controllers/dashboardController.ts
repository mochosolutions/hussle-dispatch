import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { DashboardService } from '../services/dashboardService';
import { kpisMapper, attentionItemsMapper } from './mappers/dashboardMapper';
import { toKpisResponse, toAttentionItemsResponse } from './transformers/dashboardTransformer';

interface DashboardControllerDeps {
  dashboardService: DashboardService;
}

export interface DashboardControllers {
  getKpis: RequestHandler;
  getAttentionItems: RequestHandler;
}

export const createDashboardControllers = (
  deps: DashboardControllerDeps,
): DashboardControllers => ({
  getKpis: async (req: Request, res: Response): Promise<void> => {
    const input = kpisMapper(req);
    const kpis = await deps.dashboardService.getKpis(input);
    sendSingle(res, toKpisResponse(kpis));
  },

  getAttentionItems: async (req: Request, res: Response): Promise<void> => {
    const input = attentionItemsMapper(req);
    const items = await deps.dashboardService.getAttentionItems(input);
    sendSingle(res, toAttentionItemsResponse(items));
  },
});
