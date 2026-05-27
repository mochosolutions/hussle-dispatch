import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { IftaReportService } from '../services/iftaReportService';
import { iftaReportMapper } from './mappers/iftaReportMapper';
import { toIftaReportResponse } from './transformers/iftaReportTransformer';

interface IftaReportControllerDeps {
  iftaReportService: IftaReportService;
}

export const createIftaReportController = (deps: IftaReportControllerDeps): RequestHandler =>
  async (req: Request, res: Response): Promise<void> => {
    const input = iftaReportMapper(req);
    const result = await deps.iftaReportService.generateReport(input);
    const response = toIftaReportResponse(result);
    sendSingle(res, response);
  };
