import type { Request, Response } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { RequestHandler } from 'express';
import type { CarrierService } from '../types/carrierServiceTypes';
import { createCarrierMapper } from './mappers/createCarrierMapper';
import { getRequiredCarrierIdMapper } from './mappers/getRequiredCarrierIdMapper';
import { getRequestContextMapper } from './mappers/getRequestContextMapper';
import { listCarriersMapper } from './mappers/listCarriersMapper';
import { updateCarrierMapper } from './mappers/updateCarrierMapper';
import { toCarrierListEnvelope, toCarrierResponse } from './transformers/carrierTransformer';

interface CarrierControllerDeps {
  carrierService: CarrierService;
}

export interface CarrierControllers {
  createCarrier: RequestHandler;
  listCarriers: RequestHandler;
  getCarrierById: RequestHandler;
  updateCarrier: RequestHandler;
  deleteCarrier: RequestHandler;
  getCarrierOnboarding: RequestHandler;
}

export const createCarrierControllers = (deps: CarrierControllerDeps): CarrierControllers => ({
  createCarrier: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createCarrierMapper(req);
    const carrier = await deps.carrierService.createCarrier(serviceInput);
    sendSingle(res, toCarrierResponse(carrier, serviceInput.role), 201);
  },

  listCarriers: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = listCarriersMapper(req);
    const result = await deps.carrierService.listCarriers(serviceInput);
    const response = toCarrierListEnvelope(result.data, serviceInput.role, result.meta);
    sendList(res, response.data, response.meta);
  },

  getCarrierById: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredCarrierIdMapper(req);
    const carrier = await deps.carrierService.getCarrierById({
      ...context,
      id,
    });
    sendSingle(res, toCarrierResponse(carrier, context.role));
  },

  updateCarrier: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = updateCarrierMapper(req);
    const carrier = await deps.carrierService.updateCarrier(serviceInput);
    sendSingle(res, toCarrierResponse(carrier, serviceInput.role));
  },

  deleteCarrier: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredCarrierIdMapper(req);
    await deps.carrierService.deleteCarrier({
      ...context,
      id,
    });
    res.status(204).send();
  },

  getCarrierOnboarding: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredCarrierIdMapper(req);
    const onboarding = await deps.carrierService.getCarrierOnboardingStatus({
      ...context,
      id,
    });
    sendSingle(res, onboarding);
  },
});
