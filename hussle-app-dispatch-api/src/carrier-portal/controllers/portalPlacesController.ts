import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError } from '@/shared/errors/commonErrors';
import type { AddressSearchInput, AddressSearchResult } from '@/places/types/addressSearchTypes';
import { toAddressSearchResponse } from '@/places/controllers/transformers/addressSearchTransformer';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

interface AddressSearchService {
  search(input: AddressSearchInput): Promise<AddressSearchResult[]>;
}

interface PortalPlacesControllerDeps {
  addressSearchService: AddressSearchService;
}

export interface PortalPlacesControllers {
  addressSearch: RequestHandler;
}

const parseOptionalNumber = (raw: unknown): number | null => {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const createPortalPlacesControllers = (
  deps: PortalPlacesControllerDeps,
): PortalPlacesControllers => ({
  addressSearch: async (req: Request, res: Response): Promise<void> => {
    if (!req.carrierPortal) {
      throw new UnauthorizedError('Carrier portal context is required');
    }

    const query = typeof req.query['query'] === 'string' ? req.query['query'] : '';
    const rawLimit = Number(req.query['limit']);
    const parsedLimit = Number.isInteger(rawLimit) && rawLimit >= 1 ? rawLimit : DEFAULT_LIMIT;
    const limit = Math.min(parsedLimit, MAX_LIMIT);

    const biasLat = parseOptionalNumber(req.query['biasLat']);
    const biasLng = parseOptionalNumber(req.query['biasLng']);

    const results = await deps.addressSearchService.search({
      organizationId: req.carrierPortal.organizationId,
      query,
      limit,
      biasLat,
      biasLng,
    });

    sendSingle(res, toAddressSearchResponse(results));
  },
});
