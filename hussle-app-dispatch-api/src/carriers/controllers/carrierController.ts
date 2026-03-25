import type { Request, Response } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { RequestHandler } from 'express';
import type { CarrierService } from '../types/carrierServiceTypes';
import type { CarrierStatsQueryPort } from '../repositories/carrierStatsQueryPrisma';
import { createCarrierMapper } from './mappers/createCarrierMapper';
import { createCarrierNoteMapper } from './mappers/createCarrierNoteMapper';
import { createCarrierWithAssetsMapper } from './mappers/createCarrierWithAssetsMapper';
import { getRequiredCarrierIdMapper } from './mappers/getRequiredCarrierIdMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { listCarrierNotesMapper } from './mappers/listCarrierNotesMapper';
import { listCarriersMapper } from './mappers/listCarriersMapper';
import { updateCarrierMapper } from './mappers/updateCarrierMapper';
import {
  toCarrierNoteListResponse,
  toCarrierNoteResponse,
} from './transformers/carrierNoteTransformer';
import {
  toCarrierListEnvelope,
  toCarrierResponse,
  toCarrierWithAssetsResponse,
} from './transformers/carrierTransformer';

interface CarrierControllerDeps {
  carrierService: CarrierService;
  carrierStatsQuery: CarrierStatsQueryPort;
}

export interface CarrierControllers {
  createCarrier: RequestHandler;
  createCarrierWithAssets: RequestHandler;
  listCarriers: RequestHandler;
  getCarrierById: RequestHandler;
  updateCarrier: RequestHandler;
  deleteCarrier: RequestHandler;
  getCarrierOnboarding: RequestHandler;
  listNotes: RequestHandler;
  createNote: RequestHandler;
  getCarrierStats: RequestHandler;
}

export const createCarrierControllers = (deps: CarrierControllerDeps): CarrierControllers => ({
  createCarrier: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createCarrierMapper(req);
    const carrier = await deps.carrierService.createCarrier(serviceInput);
    sendSingle(res, toCarrierResponse(carrier), 201);
  },

  createCarrierWithAssets: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createCarrierWithAssetsMapper(req);
    const carrier = await deps.carrierService.createCarrierWithAssets(serviceInput);
    sendSingle(res, toCarrierWithAssetsResponse(carrier), 201);
  },

  listCarriers: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = listCarriersMapper(req);
    const result = await deps.carrierService.listCarriers(serviceInput);
    const response = toCarrierListEnvelope(result.data, result.meta);
    sendList(res, { data: response.data, meta: response.meta });
  },

  getCarrierById: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredCarrierIdMapper(req);
    const carrier = await deps.carrierService.getCarrierById({
      ...context,
      id,
    });
    sendSingle(res, toCarrierResponse(carrier));
  },

  updateCarrier: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = updateCarrierMapper(req);
    const carrier = await deps.carrierService.updateCarrier(serviceInput);
    sendSingle(res, toCarrierResponse(carrier));
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

  listNotes: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = listCarrierNotesMapper(req);
    const result = await deps.carrierService.listNotes(serviceInput);
    const response = toCarrierNoteListResponse(result.data);
    sendList(res, { data: response, meta: result.meta });
  },

  createNote: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createCarrierNoteMapper(req);
    const note = await deps.carrierService.createNote(serviceInput);
    sendSingle(res, toCarrierNoteResponse(note), 201);
  },

  getCarrierStats: async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredCarrierIdMapper(req);
    const context = getRequestContextMapper(req);
    const stats = await deps.carrierStatsQuery.getStats(id, context.organizationId);
    sendSingle(res, stats);
  },
});
