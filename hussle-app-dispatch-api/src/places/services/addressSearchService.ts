import type { PlaceRepositoryPort, TypeaheadPlaceResult } from '../types/placeTypes';
import type { GeocodingProviderPort } from '@/shared/providers/awsLocationProviderTypes';
import type { AddressSearchInput, AddressSearchResult } from '../types/addressSearchTypes';

const MIN_QUERY_LENGTH_FOR_GEOCODING = 3;
const PLACES_THRESHOLD = 3;

interface AddressSearchServiceDeps {
  placeRepository: PlaceRepositoryPort;
  geocodingProvider: GeocodingProviderPort;
}

const mapPlaceToResult = (place: TypeaheadPlaceResult): AddressSearchResult => ({
  source: 'SAVED',
  id: place.id,
  name: place.name,
  address: place.address ?? '',
  city: place.city,
  state: place.state,
  zip: place.zip ?? '',
  lat: place.latitude,
  lng: place.longitude,
  facilityType: place.facilityType,
  contactName: place.contactName,
  contactPhone: place.contactPhone,
  appointmentRequired: false,
  lumperRequired: false,
  ppeRequired: false,
});

export const createAddressSearchService = (deps: AddressSearchServiceDeps) => ({
  search: async (input: AddressSearchInput): Promise<AddressSearchResult[]> => {
    const placeResults = await deps.placeRepository.typeahead({
      organizationId: input.organizationId,
      query: input.query,
      limit: input.limit,
    });

    const savedResults = placeResults.map(mapPlaceToResult);

    if (input.query.length < MIN_QUERY_LENGTH_FOR_GEOCODING) {
      return savedResults;
    }

    if (savedResults.length >= PLACES_THRESHOLD) {
      return savedResults.slice(0, input.limit);
    }

    const remainingSlots = input.limit - savedResults.length;

    console.log("Input Query", {query: input.query, slots: remainingSlots})

    try {
      const geocodeResults = await deps.geocodingProvider.searchAddresses(
        input.query,
        remainingSlots,
      );

      const externalResults: AddressSearchResult[] = geocodeResults.map((suggestion, index) => ({
        source: 'EXTERNAL',
        id: `ext-${index}`,
        name: suggestion.label,
        address: suggestion.address,
        city: suggestion.city,
        state: suggestion.state,
        zip: suggestion.zip,
        lat: suggestion.lat,
        lng: suggestion.lng,
        facilityType: null,
        contactName: null,
        contactPhone: null,
        appointmentRequired: false,
        lumperRequired: false,
        ppeRequired: false,
      }));

      return [...savedResults, ...externalResults];
    } catch {
      return savedResults;
    }
  },
});
