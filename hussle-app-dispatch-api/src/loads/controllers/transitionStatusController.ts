import type { Request, Response, RequestHandler } from 'express';
import type { LoadStatusService } from '../services/loadStatusService';
import { transitionStatusMapper } from './mappers/transitionStatusMapper';
import { toStatusTransitionResponse } from './transformers/statusTransitionTransformer';

interface TransitionStatusControllerDeps {
  loadStatusService: LoadStatusService;
}

export const createTransitionStatusController = (
  deps: TransitionStatusControllerDeps,
): RequestHandler =>
  async (req: Request, res: Response): Promise<void> => {
    const input = transitionStatusMapper(req);
    const result = await deps.loadStatusService.transitionStatus(input);
    const response = toStatusTransitionResponse(result);

    const statusCode = result.success ? 200 : 422;
    res.status(statusCode).json({ data: response });
  };
