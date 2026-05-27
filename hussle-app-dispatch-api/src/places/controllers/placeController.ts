import type { Request, Response } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { RequestHandler } from 'express';
import type { PlaceService } from '../types/placeServiceTypes';
import type { AddressSearchInput, AddressSearchResult } from '../types/addressSearchTypes';
import type { PlaceStatsQueryPort } from '../repositories/placeStatsQueryPrisma';
import { createPlaceMapper } from './mappers/createPlaceMapper';
import { getRequiredPlaceIdMapper } from './mappers/getRequiredPlaceIdMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { listPlacesMapper } from './mappers/listPlacesMapper';
import { loadsAtFacilityMapper } from './mappers/loadsAtFacilityMapper';
import { typeaheadMapper } from './mappers/typeaheadMapper';
import { addressSearchMapper } from './mappers/addressSearchMapper';
import { updatePlaceMapper } from './mappers/updatePlaceMapper';
import {
  toPlaceListEnvelope,
  toPlaceResponse,
} from './transformers/placeTransformer';
import { toLoadsAtFacilityEnvelope } from './transformers/loadAtFacilityTransformer';
import { toAddressSearchResponse } from './transformers/addressSearchTransformer';

interface AddressSearchService {
  search(input: AddressSearchInput): Promise<AddressSearchResult[]>;
}

interface PlaceControllerDeps {
  placeService: PlaceService;
  addressSearchService: AddressSearchService;
  placeStatsQuery: PlaceStatsQueryPort;
}

export interface PlaceControllers {
  createPlace: RequestHandler;
  listPlaces: RequestHandler;
  getPlaceById: RequestHandler;
  updatePlace: RequestHandler;
  deletePlace: RequestHandler;
  typeahead: RequestHandler;
  addressSearch: RequestHandler;
  loadsAtFacility: RequestHandler;
  getPlaceStats: RequestHandler;
}

export const createPlaceControllers = (deps: PlaceControllerDeps): PlaceControllers => ({
  createPlace: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createPlaceMapper(req);
    const place = await deps.placeService.createPlace(serviceInput);
    sendSingle(res, toPlaceResponse(place), 201);
  },

  listPlaces: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = listPlacesMapper(req);
    const result = await deps.placeService.listPlaces(serviceInput);
    const response = toPlaceListEnvelope(result.data, result.meta);
    sendList(res, { data: response.data, meta: response.meta });
  },

  getPlaceById: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredPlaceIdMapper(req);
    const place = await deps.placeService.getPlaceById({
      ...context,
      id,
    });
    sendSingle(res, toPlaceResponse(place));
  },

  updatePlace: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = updatePlaceMapper(req);
    const place = await deps.placeService.updatePlace(serviceInput);
    sendSingle(res, toPlaceResponse(place));
  },

  deletePlace: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredPlaceIdMapper(req);
    await deps.placeService.deletePlace({
      ...context,
      id,
    });
    res.status(204).send();
  },

  typeahead: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = typeaheadMapper(req);
    const data = await deps.placeService.typeahead(serviceInput);
    sendSingle(res, data);
  },

  addressSearch: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = addressSearchMapper(req);
    const results = await deps.addressSearchService.search(serviceInput);
    sendSingle(res, toAddressSearchResponse(results));
  },

  loadsAtFacility: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = loadsAtFacilityMapper(req);
    const result = await deps.placeService.loadsAtFacility(serviceInput);
    const response = toLoadsAtFacilityEnvelope(result.data, result.meta);
    sendList(res, { data: response.data, meta: response.meta });
  },

  getPlaceStats: async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredPlaceIdMapper(req);
    const context = getRequestContextMapper(req);
    await deps.placeService.getPlaceById({ ...context, id });
    const stats = await deps.placeStatsQuery.getStats(id, context.organizationId);
    sendSingle(res, stats);
  },
});
