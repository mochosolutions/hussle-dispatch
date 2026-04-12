import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { StateMilesOverrideService } from '../services/stateMilesOverrideService';
import { putStateMilesMapper, getStateMilesMapper } from './mappers/stateMilesMapper';
import { toStateMilesResponse } from './transformers/stateMilesTransformer';

interface StateMilesControllerDeps {
  stateMilesOverrideService: StateMilesOverrideService;
}

export interface StateMilesControllers {
  putStateMiles: RequestHandler;
  getStateMiles: RequestHandler;
}

export const createStateMilesControllers = (
  deps: StateMilesControllerDeps,
): StateMilesControllers => ({
  putStateMiles: async (req: Request, res: Response): Promise<void> => {
    const input = putStateMilesMapper(req);
    await deps.stateMilesOverrideService.overrideStateMiles(input);
    sendSingle(res, { message: 'State miles updated' });
  },

  getStateMiles: async (req: Request, res: Response): Promise<void> => {
    const input = getStateMilesMapper(req);
    const entries = await deps.stateMilesOverrideService.getStateMiles(input);
    const response = toStateMilesResponse(entries);
    sendSingle(res, response);
  },
});
