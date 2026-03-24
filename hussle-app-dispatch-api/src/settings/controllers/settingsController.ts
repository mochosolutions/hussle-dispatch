import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError } from '@/shared/errors';
import type { SettingsService } from '../services/settingsService';
import { updateSettingsMapper } from './mappers/updateSettingsMapper';
import { toSettingsResponse } from './transformers/settingsTransformer';

interface SettingsControllerDeps {
  settingsService: SettingsService;
}

export interface SettingsControllers {
  get: RequestHandler;
  update: RequestHandler;
}

export const createSettingsControllers = (deps: SettingsControllerDeps): SettingsControllers => ({
  get: async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId;

    if (organizationId === undefined) {
      throw new UnauthorizedError('Authentication required');
    }

    const settings = await deps.settingsService.getSettings(organizationId);
    sendSingle(res, toSettingsResponse(settings));
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const input = updateSettingsMapper(req);
    const settings = await deps.settingsService.updateSettings(input);
    sendSingle(res, toSettingsResponse(settings));
  },
});
