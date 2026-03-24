import type { AddressSearchResult } from '../../types/addressSearchTypes';

export interface AddressSearchResponse {
  source: string;
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
}

export const toAddressSearchResponse = (
  results: AddressSearchResult[],
): AddressSearchResponse[] =>
  results.map((result) => ({
    source: result.source,
    id: result.id,
    name: result.name,
    address: result.address,
    city: result.city,
    state: result.state,
    zip: result.zip,
    lat: result.lat,
    lng: result.lng,
    facilityType: result.facilityType,
    contactName: result.contactName,
    contactPhone: result.contactPhone,
    appointmentRequired: result.appointmentRequired,
    lumperRequired: result.lumperRequired,
    ppeRequired: result.ppeRequired,
  }));
