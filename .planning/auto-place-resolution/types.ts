// Auto-generated from contract.yaml — DO NOT EDIT MANUALLY

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum PlaceSource {
  USER = 'USER',
  AUTO = 'AUTO',
}

export enum StopResolutionStatus {
  RESOLVED = 'RESOLVED',
  UNRESOLVED = 'UNRESOLVED',
  AMBIGUOUS = 'AMBIGUOUS',
}

export enum WarningCode {
  STOP_NOT_GEOCODED = 'STOP_NOT_GEOCODED',
  STOP_AMBIGUOUS_ADDRESS = 'STOP_AMBIGUOUS_ADDRESS',
  STOP_PARTIAL_ADDRESS = 'STOP_PARTIAL_ADDRESS',
  GEOCODER_UNAVAILABLE = 'GEOCODER_UNAVAILABLE',
}

export enum AddressSearchResultSource {
  SAVED = 'SAVED',
  EXTERNAL = 'EXTERNAL',
}

export enum StopType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

// ---------------------------------------------------------------------------
// Envelopes
// ---------------------------------------------------------------------------

export interface Warning {
  code: WarningCode;
  stopSequence: number;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Load + Stop shapes (subset touched by this contract)
// ---------------------------------------------------------------------------

export interface Stop {
  id: string;
  loadId: string;
  sequence: number;
  placeId?: string | null;
  facilityName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  resolutionStatus: StopResolutionStatus;
}

export interface Load {
  id: string;
  organizationId: string;
  stops: Stop[];
}

export interface CreateStopRequest {
  type: StopType;
  sequence: number;
  placeId?: string | null;
  facilityName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  appointmentStart: string;
  appointmentEnd?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
}

export interface UpdateStopRequest {
  id?: string;
  placeId?: string | null;
  facilityName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  appointmentStart?: string;
  appointmentEnd?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
}

export interface CreateLoadRequest {
  stops: CreateStopRequest[];
}

export interface UpdateLoadRequest {
  stops?: UpdateStopRequest[];
}

export interface LoadCreateResponse {
  data: Load;
  warnings: Warning[];
}

export interface LoadUpdateResponse {
  data: Load;
  warnings: Warning[];
}

export interface LoadResponse {
  data: Load;
}

export interface StopWriteResponse {
  data: Stop;
  warnings: Warning[];
}

// ---------------------------------------------------------------------------
// Place shapes (subset touched by this contract)
// ---------------------------------------------------------------------------

export interface Place {
  id: string;
  organizationId: string;
  name: string;
  address?: string | null;
  address2?: string | null;
  city: string;
  state: string;
  zip?: string | null;
  unit?: string | null;
  source: PlaceSource;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlaceRequest {
  name: string;
  address?: string | null;
  address2?: string | null;
  city: string;
  state: string;
  zip?: string | null;
  unit?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdatePlaceRequest {
  name?: string;
  address?: string | null;
  address2?: string | null;
  city?: string;
  state?: string;
  zip?: string | null;
  unit?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PlaceListResponse {
  data: Place[];
  meta: PaginationMeta;
}

export interface AddressSearchResult {
  source: AddressSearchResultSource;
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface AddressSearchResponse {
  data: AddressSearchResult[];
}

// ---------------------------------------------------------------------------
// Settings shape (subset touched by this contract)
// ---------------------------------------------------------------------------

export interface SettingsResponse {
  id: string;
  organizationId: string;
  headquartersLatitude: number | null;
  headquartersLongitude: number | null;
}

export interface UpdateSettingsRequest {
  headquartersLatitude?: number | null;
  headquartersLongitude?: number | null;
}
