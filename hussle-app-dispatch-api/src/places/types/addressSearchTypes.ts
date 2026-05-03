export interface AddressSearchInput {
  organizationId: string;
  query: string;
  limit: number;
  biasLat?: number | null;
  biasLng?: number | null;
}

export interface AddressSearchResult {
  source: 'SAVED' | 'EXTERNAL';
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  facilityType: string | null;
  contactName: string | null;
  contactPhone: string | null;
  appointmentRequired: boolean;
  lumperRequired: boolean;
  ppeRequired: boolean;
  facilityHours: FacilityDayHoursEntry[] | null;
  is24Hours: boolean;
}

export interface FacilityDayHoursEntry {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  is24Hours: boolean;
}
