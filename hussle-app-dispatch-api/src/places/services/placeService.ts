import type Redis from 'ioredis';
import type { Place } from '@prisma/client';
import { NotFoundError, ValidationError } from '@/shared/errors';
import { getCityCoords } from '@/shared/geoLookup';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import { buildPaginationMeta } from '@/shared/responseEnvelope';
import { validateFacilityHoursJson } from '@/shared/utils/facilityHours';
import type { PlaceRepositoryPort } from '../types/placeTypes';
import type {
  CreatePlaceServiceInput,
  DeletePlaceServiceInput,
  GetPlaceByIdServiceInput,
  ListPlacesServiceInput,
  LoadsAtFacilityServiceInput,
  PlaceService,
  TypeaheadServiceInput,
  UpdatePlaceServiceInput,
} from '../types/placeServiceTypes';

const listSortableFields = ['createdAt', 'updatedAt', 'name', 'city', 'state'] as const;

const getSafeSortField = (field: string): (typeof listSortableFields)[number] => {
  const matched = listSortableFields.find((allowedField) => allowedField === field);
  if (matched !== undefined) {
    return matched;
  }
  return 'createdAt';
};

const findPlaceOrThrow = async (
  id: string,
  organizationId: string,
  deps: PlaceServiceDeps,
): Promise<Place> => {
  const place = await deps.placeRepository.findById(id, organizationId);
  if (place === null) {
    throw new NotFoundError('Place not found.');
  }
  return place;
};

const validateTimezone = (timezone: string): void => {
  const validTimezones = Intl.supportedValuesOf('timeZone');
  if (!validTimezones.includes(timezone)) {
    throw new ValidationError(`Invalid timezone: "${timezone}". Must be a valid IANA timezone.`);
  }
};

interface PlaceServiceDeps {
  placeRepository: PlaceRepositoryPort;
  redis: Redis;
}

export const createPlaceService = (deps: PlaceServiceDeps): PlaceService => ({
  createPlace: async ({ organizationId, input }: CreatePlaceServiceInput) => {
    if (input.facilityHours !== undefined) {
      validateFacilityHoursJson(input.facilityHours);
    }

    if (input.timezone !== undefined) {
      validateTimezone(input.timezone);
    }

    const geoResult = await getCityCoords(deps.redis, input.state, input.city);

    // User-initiated POST /places always creates with source=USER. Any client-supplied
    // `source` is ignored — only the internal AUTO-creation path (resolveStopToPlace)
    // sets source=AUTO via the repository directly.
    const createData = {
      ...input,
      latitude: geoResult?.lat ?? input.latitude,
      longitude: geoResult?.lng ?? input.longitude,
      geoSource: geoResult !== null ? 'AUTO' as const : (input.geoSource ?? 'AUTO' as const),
      source: 'USER',
    };

    return deps.placeRepository.create(organizationId, createData);
  },

  listPlaces: async ({ query, organizationId, filters }: ListPlacesServiceInput) => {
    const params = parsePaginationParams(query);
    const sort = getSafeSortField(params.sort);

    return paginateQuery(
      { ...params, sort },
      {
        findMany: ({ skip, take, orderBy }) =>
          deps.placeRepository.list({
            organizationId,
            filters,
            skip,
            take,
            orderBy,
          }),
        count: () =>
          deps.placeRepository.count({
            organizationId,
            filters,
          }),
      },
    );
  },

  getPlaceById: async ({ id, organizationId }: GetPlaceByIdServiceInput) =>
    findPlaceOrThrow(id, organizationId, deps),

  updatePlace: async ({ id, organizationId, input }: UpdatePlaceServiceInput) => {
    const existingPlace = await findPlaceOrThrow(id, organizationId, deps);

    if (input.facilityHours !== undefined) {
      validateFacilityHoursJson(input.facilityHours);
    }

    if (input.timezone !== undefined) {
      validateTimezone(input.timezone);
    }

    const cityChanged = input.city !== undefined && input.city !== existingPlace.city;
    const stateChanged = input.state !== undefined && input.state !== existingPlace.state;

    let updateData = { ...input };

    if (cityChanged || stateChanged) {
      const resolvedCity = input.city ?? existingPlace.city;
      const resolvedState = input.state ?? existingPlace.state;
      const geoResult = await getCityCoords(deps.redis, resolvedState, resolvedCity);

      if (geoResult !== null) {
        updateData = {
          ...updateData,
          latitude: geoResult.lat,
          longitude: geoResult.lng,
          geoSource: 'AUTO' as const,
        };
      }
    }

    // Source flip: any user-initiated PATCH on an AUTO-created place promotes it
    // to USER. Observed (a human touched the row), not field-compared. The internal
    // AUTO-fill path in resolveStopToPlace writes through the repository directly
    // and bypasses this service, so it does not trigger a flip.
    if (existingPlace.source === 'AUTO') {
      updateData = {
        ...updateData,
        source: 'USER',
      };
    }

    return deps.placeRepository.update(id, updateData);
  },

  deletePlace: async ({ id, organizationId }: DeletePlaceServiceInput) => {
    await findPlaceOrThrow(id, organizationId, deps);
    await deps.placeRepository.softDelete(id, new Date());
  },

  typeahead: async ({ organizationId, query, limit }: TypeaheadServiceInput) =>
    deps.placeRepository.typeahead({ organizationId, query, limit }),

  loadsAtFacility: async ({ id, organizationId, query }: LoadsAtFacilityServiceInput) => {
    await findPlaceOrThrow(id, organizationId, deps);

    const params = parsePaginationParams(query);
    const sort = 'createdAt';
    const { page, limit, order } = params;
    const skip = (page - 1) * limit;

    const result = await deps.placeRepository.findLoadsAtFacility({
      placeId: id,
      skip,
      take: limit,
      orderBy: { [sort]: order },
    });

    return {
      data: result.data,
      meta: buildPaginationMeta(result.total, page, limit),
    };
  },
});
