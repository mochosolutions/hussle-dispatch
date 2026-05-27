import type { Request, Response } from 'express';
import type { SaveLanePreferencesInput } from '../types/lanePreferencesTypes';
import { sendSingle } from '@/shared/responseEnvelope';
import { lanePreferencesMapper } from './mappers/lanePreferencesMapper';
import { lanePreferencesTransformer } from './transformers/lanePreferencesTransformer';

interface LanePreferencesService {
  saveLanePreferences(
    carrierId: string,
    organizationId: string,
    input: SaveLanePreferencesInput,
  ): Promise<{ saved: boolean }>;
}

interface LanePreferencesControllerDeps {
  lanePreferencesService: LanePreferencesService;
}

export const createLanePreferencesControllers = (deps: LanePreferencesControllerDeps) => ({
  saveLanePreferences: async (req: Request, res: Response) => {
    const { carrierId, organizationId, input } = lanePreferencesMapper(req);
    const result = await deps.lanePreferencesService.saveLanePreferences(carrierId, organizationId, input);
    const response = lanePreferencesTransformer(result);
    sendSingle(res, response);
  },
});
