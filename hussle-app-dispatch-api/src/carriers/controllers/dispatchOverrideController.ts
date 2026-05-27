import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { createDispatchOverrideService } from '../services/dispatchOverrideService';
import { dispatchOverrideMapper } from './mappers/dispatchOverrideMapper';
import { toDispatchOverrideResponse } from './transformers/dispatchOverrideTransformer';

type DispatchOverrideService = ReturnType<typeof createDispatchOverrideService>;

interface DispatchOverrideControllerDeps {
  dispatchOverrideService: DispatchOverrideService;
}

export interface DispatchOverrideControllers {
  dispatchOverride: RequestHandler;
}

export const createDispatchOverrideControllers = (
  deps: DispatchOverrideControllerDeps,
): DispatchOverrideControllers => ({
  dispatchOverride: async (req: Request, res: Response): Promise<void> => {
    const input = dispatchOverrideMapper(req);
    const result = await deps.dispatchOverrideService.override(input);
    sendSingle(res, toDispatchOverrideResponse(result.data));
  },
});
