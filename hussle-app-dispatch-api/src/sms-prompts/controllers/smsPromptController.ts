import type { Request, RequestHandler, Response } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { Logger } from '@/shared/utils/logger';
import type { SmsPromptService } from '../services/smsPromptService';
import { listPromptsForLoadMapper } from './mappers/listPromptsForLoadMapper';
import { sendManualPromptMapper } from './mappers/sendManualPromptMapper';
import { toSmsPromptScheduleResponse } from './transformers/smsPromptScheduleTransformer';

export interface SmsPromptControllerDeps {
  smsPromptService: SmsPromptService;
  logger: Logger;
}

export interface SmsPromptControllers {
  sendManual: RequestHandler;
  listForLoad: RequestHandler;
}

export const createSmsPromptController = (
  deps: SmsPromptControllerDeps,
): SmsPromptControllers => ({
  sendManual: async (req: Request, res: Response): Promise<void> => {
    const input = sendManualPromptMapper(req);
    const row = await deps.smsPromptService.sendManualPrompt(input);
    sendSingle(res, toSmsPromptScheduleResponse(row), 201);
  },

  listForLoad: async (req: Request, res: Response): Promise<void> => {
    const input = listPromptsForLoadMapper(req);
    const result = await deps.smsPromptService.listPromptsForLoad(input);
    sendList(res, {
      data: result.data.map(toSmsPromptScheduleResponse),
      meta: result.meta,
    });
  },
});
