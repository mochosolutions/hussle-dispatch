import type { ParsedQs } from 'qs';
import type { Place, Load, Stop } from '@prisma/client';
import type { PaginationMeta } from '@/shared/responseEnvelope';
import type {
  CreatePlaceInput,
  PlaceListFilters,
  TypeaheadPlaceResult,
  UpdatePlaceInput,
} from './placeTypes';

export interface CreatePlaceServiceInput {
  organizationId: string;
  role: string;
  input: CreatePlaceInput;
}

export interface ListPlacesServiceInput {
  query: ParsedQs;
  organizationId: string;
  filters: PlaceListFilters;
  role: string;
}

export interface GetPlaceByIdServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface UpdatePlaceServiceInput {
  id: string;
  organizationId: string;
  input: UpdatePlaceInput;
  role: string;
}

export interface DeletePlaceServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface ListPlacesResult {
  data: Place[];
  meta: PaginationMeta;
}

export interface TypeaheadServiceInput {
  organizationId: string;
  query: string;
  limit: number;
}

export interface LoadsAtFacilityServiceInput {
  id: string;
  organizationId: string;
  query: ParsedQs;
}

export interface LoadsAtFacilityResult {
  data: (Load & { stops: Stop[] })[];
  meta: PaginationMeta;
}

export interface PlaceService {
  createPlace(input: CreatePlaceServiceInput): Promise<Place>;
  listPlaces(input: ListPlacesServiceInput): Promise<ListPlacesResult>;
  getPlaceById(input: GetPlaceByIdServiceInput): Promise<Place>;
  updatePlace(input: UpdatePlaceServiceInput): Promise<Place>;
  deletePlace(input: DeletePlaceServiceInput): Promise<void>;
  typeahead(input: TypeaheadServiceInput): Promise<TypeaheadPlaceResult[]>;
  loadsAtFacility(input: LoadsAtFacilityServiceInput): Promise<LoadsAtFacilityResult>;
}
