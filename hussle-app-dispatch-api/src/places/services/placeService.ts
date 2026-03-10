import type Redis from 'ioredis';
import type { Place } from '@prisma/client';
import { NotFoundError } from '@/shared/errors';
import { getCityCoords } from '@/shared/geoLookup';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import { buildPaginationMeta } from '@/shared/responseEnvelope';
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

interface PlaceServiceDeps {
  placeRepository: PlaceRepositoryPort;
  redis: Redis;
}

export const createPlaceService = (deps: PlaceServiceDeps): PlaceService => ({
  createPlace: async ({ organizationId, input }: CreatePlaceServiceInput) => {
    const geoResult = await getCityCoords(deps.redis, input.state, input.city);

    const createData = {
      ...input,
      latitude: geoResult?.lat ?? input.latitude,
      longitude: geoResult?.lng ?? input.longitude,
      geoSource: geoResult !== null ? 'AUTO' as const : (input.geoSource ?? 'AUTO' as const),
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
