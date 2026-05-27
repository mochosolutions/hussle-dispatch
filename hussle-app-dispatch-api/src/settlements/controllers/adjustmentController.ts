import type { Request, Response, RequestHandler } from 'express';
import type {
  CreateAdjustmentInput,
  UpdateAdjustmentInput,
  DeleteAdjustmentInput,
  SettlementWithRelations,
} from '../types/settlementTypes';
import { sendSingle } from '../../shared/responseEnvelope';
import { toSettlementDetailResponse } from './transformers/settlementTransformer';
import {
  createAdjustmentMapper,
  updateAdjustmentMapper,
  deleteAdjustmentMapper,
} from './mappers/settlementMappers';

interface AdjustmentControllerDeps {
  adjustmentService: {
    addAdjustment: (input: CreateAdjustmentInput) => Promise<SettlementWithRelations>;
    updateAdjustment: (input: UpdateAdjustmentInput) => Promise<SettlementWithRelations>;
    deleteAdjustment: (input: DeleteAdjustmentInput) => Promise<SettlementWithRelations>;
  };
}

export interface AdjustmentControllers {
  addAdjustment: RequestHandler;
  updateAdjustment: RequestHandler;
  deleteAdjustment: RequestHandler;
}

export const createAdjustmentControllers = (
  deps: AdjustmentControllerDeps,
): AdjustmentControllers => ({
  addAdjustment: async (req: Request, res: Response): Promise<void> => {
    const input = createAdjustmentMapper(req);
    const settlement = await deps.adjustmentService.addAdjustment(input);
    sendSingle(res, toSettlementDetailResponse(settlement), 201);
  },

  updateAdjustment: async (req: Request, res: Response): Promise<void> => {
    const input = updateAdjustmentMapper(req);
    const settlement = await deps.adjustmentService.updateAdjustment(input);
    sendSingle(res, toSettlementDetailResponse(settlement));
  },

  deleteAdjustment: async (req: Request, res: Response): Promise<void> => {
    const input = deleteAdjustmentMapper(req);
    const settlement = await deps.adjustmentService.deleteAdjustment(input);
    sendSingle(res, toSettlementDetailResponse(settlement));
  },
});
