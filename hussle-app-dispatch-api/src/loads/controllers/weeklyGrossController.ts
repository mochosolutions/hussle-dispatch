import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { WeeklyGrossService } from '../services/weeklyGrossService';
import { weeklyGrossMapper } from './mappers/weeklyGrossMapper';
import { toWeeklyGrossResponse } from './transformers/weeklyGrossTransformer';

interface WeeklyGrossControllerDeps {
  weeklyGrossService: WeeklyGrossService;
}

export const createWeeklyGrossController = (
  deps: WeeklyGrossControllerDeps,
): RequestHandler =>
  async (req: Request, res: Response): Promise<void> => {
    const input = weeklyGrossMapper(req);
    const items = await deps.weeklyGrossService.getWeeklyGross(input);
    sendSingle(res, toWeeklyGrossResponse(items));
  };
