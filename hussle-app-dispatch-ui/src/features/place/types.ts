export type FacilityType =
  | 'WAREHOUSE'
  | 'DISTRIBUTION_CENTER'
  | 'MANUFACTURING'
  | 'COLD_STORAGE'
  | 'CROSS_DOCK'
  | 'PORT'
  | 'RAIL_YARD'
  | 'DROP_YARD'
  | 'OTHER';

export type DockType = 'DOCK_HIGH' | 'GROUND_LEVEL' | 'BOTH' | 'NONE';

export type GeoSource = 'MANUAL' | 'GEOCODED' | 'GPS' | null;

export interface Place {
  id: string;
  name: string;
  facilityType: FacilityType | null;
  dockType: DockType | null;
  address: string | null;
  address2: string | null;
  city: string;
  state: string;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  geoSource: GeoSource;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  operatingHours: string | null;
  receivingHours: string | null;
  appointmentRequired: boolean;
  lumperRequired: boolean;
  ppeRequired: boolean;
  checkInProcedures: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type PlaceListItem = Place;

export interface CreatePlaceInput {
  name: string;
  facilityType?: FacilityType | null;
  dockType?: DockType | null;
  address?: string | null;
  address2?: string | null;
  city: string;
  state: string;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  operatingHours?: string | null;
  receivingHours?: string | null;
  appointmentRequired?: boolean;
  lumperRequired?: boolean;
  ppeRequired?: boolean;
  checkInProcedures?: string | null;
  notes?: string | null;
}

export interface UpdatePlaceInput {
  name?: string;
  facilityType?: FacilityType | null;
  dockType?: DockType | null;
  address?: string | null;
  address2?: string | null;
  city?: string;
  state?: string;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  operatingHours?: string | null;
  receivingHours?: string | null;
  appointmentRequired?: boolean;
  lumperRequired?: boolean;
  ppeRequired?: boolean;
  checkInProcedures?: string | null;
  notes?: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}
