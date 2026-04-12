import type { Request, Response } from 'express';
import type { SaveLanePreferencesInput } from '../types/lanePreferencesTypes';
import { sendSingle } from '@/shared/responseEnvelope';
import { lanePreferencesMapper } from './mappers/lanePreferencesMapper';
import { lanePreferencesTransformer } from './transformers/lanePreferencesTransformer';

interface LanePreferencesService {
  saveLanePreferences(
    carrierId: string,
    input: SaveLanePreferencesInput,
  ): Promise<{ saved: boolean }>;
}

interface LanePreferencesControllerDeps {
  lanePreferencesService: LanePreferencesService;
}

export const createLanePreferencesControllers = (deps: LanePreferencesControllerDeps) => ({
  saveLanePreferences: async (req: Request, res: Response) => {
    const { carrierId, input } = lanePreferencesMapper(req);
    const result = await deps.lanePreferencesService.saveLanePreferences(carrierId, input);
    const response = lanePreferencesTransformer(result);
    sendSingle(res, response);
  },
});
