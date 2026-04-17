import type { PlaceRepositoryPort, TypeaheadPlaceResult } from '../types/placeTypes';
import type { GeocodingProviderPort } from '@/shared/providers/awsLocationProviderTypes';
import type { AddressSearchInput, AddressSearchResult, FacilityDayHoursEntry } from '../types/addressSearchTypes';
import { validateFacilityHoursJson } from '@/shared/utils/facilityHours';

const MIN_QUERY_LENGTH_FOR_GEOCODING = 3;
const PLACES_THRESHOLD = 3;

const buildDedupeKey = (city: string, state: string, address: string): string =>
  `${city.toLowerCase().trim()}|${state.toLowerCase().trim()}|${address.toLowerCase().trim()}`;

const deduplicateResults = (
  savedResults: AddressSearchResult[],
  externalResults: AddressSearchResult[],
): AddressSearchResult[] => {
  const savedKeys = new Set(
    savedResults.map((r) => buildDedupeKey(r.city, r.state, r.address)),
  );

  const seen = new Set<string>();
  const uniqueExternal = externalResults.filter((result) => {
    const key = buildDedupeKey(result.city, result.state, result.address);

    if (savedKeys.has(key) || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return [...savedResults, ...uniqueExternal];
};

interface AddressSearchServiceDeps {
  placeRepository: PlaceRepositoryPort;
  geocodingProvider: GeocodingProviderPort;
}

const parseFacilityHours = (raw: unknown): FacilityDayHoursEntry[] | null => {
  if (raw === null || raw === undefined) return null;
  try {
    return validateFacilityHoursJson(raw);
  } catch {
    return null;
  }
};

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
  appointmentRequired: place.appointmentRequired ?? false,
  lumperRequired: place.lumperRequired ?? false,
  ppeRequired: place.ppeRequired ?? false,
  facilityHours: parseFacilityHours(place.facilityHours),
  is24Hours: place.is24Hours ?? false,
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
        facilityHours: null,
        is24Hours: false,
      }));

      return deduplicateResults(savedResults, externalResults);
    } catch {
      return savedResults;
    }
  },
});
