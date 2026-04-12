import type { Request, Response } from 'express';
import type { CostAnalysisInput, CostAnalysisResult } from '../types/costAnalysisTypes';
import { sendSingle } from '@/shared/responseEnvelope';
import { costAnalysisMapper } from './mappers/costAnalysisMapper';
import { costAnalysisTransformer } from './transformers/costAnalysisTransformer';

interface CostAnalysisService {
  saveCostAnalysis(carrierId: string, input: CostAnalysisInput): Promise<CostAnalysisResult>;
}

interface CostAnalysisControllerDeps {
  costAnalysisService: CostAnalysisService;
}

export const createCostAnalysisControllers = (deps: CostAnalysisControllerDeps) => ({
  saveCostAnalysis: async (req: Request, res: Response) => {
    const { carrierId, input } = costAnalysisMapper(req);
    const result = await deps.costAnalysisService.saveCostAnalysis(carrierId, input);
    const response = costAnalysisTransformer(result);
    sendSingle(res, response);
  },
});
