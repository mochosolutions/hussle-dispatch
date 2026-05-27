import type { Place, Prisma, FacilityType, DockType, GeoSource, Load, Stop } from '@prisma/client';
import type { SortOrder } from '@/shared/pagination';

export interface CreatePlaceInput {
  contactId?: string;
  customerId?: string;
  name: string;
  address?: string;
  address2?: string;
  city: string;
  state: string;
  zip?: string;
  unit?: string | null;
  source?: string;
  awsAddressNumber?: string | null;
  awsStreetBaseName?: string | null;
  awsStreetType?: string | null;
  awsStreetPrefix?: string | null;
  awsRegion?: string | null;
  awsPostalCode5?: string | null;
  latitude?: number;
  longitude?: number;
  geoSource?: GeoSource;
  facilityType?: FacilityType;
  facilityHours?: Prisma.InputJsonValue;
  is24Hours?: boolean;
  timezone?: string;
  appointmentRequired?: boolean;
  dockType?: DockType;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  checkInProcedures?: string;
  lumperRequired?: boolean;
  ppeRequired?: boolean;
  notes?: string;
  status?: string;
}

export interface DedupeKeyParams {
  organizationId: string;
  name: string;
  awsAddressNumber: string | null;
  awsStreetBaseName: string | null;
  awsStreetType: string | null;
  awsStreetPrefix: string | null;
  unit: string | null;
  awsRegion: string | null;
  awsPostalCode5: string | null;
}

export interface UpdatePlaceInput {
  contactId?: string | null;
  customerId?: string | null;
  unit?: string | null;
  source?: string;
  awsAddressNumber?: string | null;
  awsStreetBaseName?: string | null;
  awsStreetType?: string | null;
  awsStreetPrefix?: string | null;
  awsRegion?: string | null;
  awsPostalCode5?: string | null;
  name?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  geoSource?: GeoSource;
  facilityType?: FacilityType | null;
  facilityHours?: Prisma.InputJsonValue;
  is24Hours?: boolean;
  timezone?: string;
  appointmentRequired?: boolean;
  dockType?: DockType | null;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  checkInProcedures?: string;
  lumperRequired?: boolean;
  ppeRequired?: boolean;
  notes?: string;
  status?: string;
}

export type PlaceSource = 'USER' | 'AUTO';

export interface PlaceListFilters {
  search?: string;
  facilityType?: FacilityType;
  state?: string;
  contactId?: string;
  customerId?: string;
  source?: PlaceSource;
}

export interface PlaceQueryInput {
  organizationId: string;
  filters: PlaceListFilters;
}

export interface ListPlacesRepositoryInput extends PlaceQueryInput {
  skip: number;
  take: number;
  orderBy: Record<string, SortOrder>;
}

export interface TypeaheadPlaceInput {
  organizationId: string;
  query: string;
  limit: number;
}

export interface TypeaheadPlaceResult {
  id: string;
  name: string;
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  facilityType: FacilityType | null;
  contactName: string | null;
  contactPhone: string | null;
  latitude: number | null;
  longitude: number | null;
  appointmentRequired: boolean;
  lumperRequired: boolean;
  ppeRequired: boolean;
  facilityHours: unknown;
  is24Hours: boolean;
}

export interface FindLoadsAtFacilityInput {
  placeId: string;
  skip: number;
  take: number;
  orderBy: Record<string, SortOrder>;
}

export interface FindLoadsAtFacilityResult {
  data: (Load & { stops: Stop[] })[];
  total: number;
}

export interface PlaceRepositoryPort {
  create(organizationId: string, input: CreatePlaceInput): Promise<Place>;
  findById(id: string, organizationId: string): Promise<Place | null>;
  findByDedupeKey(params: DedupeKeyParams): Promise<Place | null>;
  createOnConflictDoNothing(
    organizationId: string,
    input: CreatePlaceInput,
    key: DedupeKeyParams,
  ): Promise<Place>;
  list(input: ListPlacesRepositoryInput): Promise<Place[]>;
  count(input: PlaceQueryInput): Promise<number>;
  update(id: string, input: UpdatePlaceInput): Promise<Place>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
  typeahead(input: TypeaheadPlaceInput): Promise<TypeaheadPlaceResult[]>;
  findLoadsAtFacility(input: FindLoadsAtFacilityInput): Promise<FindLoadsAtFacilityResult>;
}

export interface PlaceResponse {
  id: string;
  organizationId: string;
  contactId: string | null;
  customerId: string | null;
  name: string;
  address: string | null;
  address2: string | null;
  city: string;
  state: string;
  zip: string | null;
  unit: string | null;
  source: PlaceSource;
  latitude: number | null;
  longitude: number | null;
  geoSource: GeoSource;
  facilityType: FacilityType | null;
  facilityHours: Prisma.JsonValue;
  is24Hours: boolean;
  timezone: string | null;
  appointmentRequired: boolean;
  dockType: DockType | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  checkInProcedures: string | null;
  lumperRequired: boolean;
  ppeRequired: boolean;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
