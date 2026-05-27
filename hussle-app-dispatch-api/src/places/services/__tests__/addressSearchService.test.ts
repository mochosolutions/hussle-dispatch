import { createAddressSearchService } from '../addressSearchService';
import type { PlaceRepositoryPort, TypeaheadPlaceResult } from '../../types/placeTypes';
import type { GeocodingProviderPort, GeocodeSuggestion } from '@/shared/providers/awsLocationProviderTypes';
import type { AddressSearchResult } from '../../types/addressSearchTypes';
import type { OrganizationQueryPort } from '../../types/organizationQueryPort';

const createMockPlaceRepo = (): Pick<PlaceRepositoryPort, 'typeahead'> => ({
  typeahead: jest.fn(),
});

const createMockGeocodingProvider = (): GeocodingProviderPort => ({
  searchAddresses: jest.fn(),
  geocode: jest.fn(),
});

const createMockOrgQueries = (): OrganizationQueryPort => ({
  findHeadquartersLocation: jest.fn(),
});

const buildPlaceResult = (overrides: Partial<TypeaheadPlaceResult> = {}): TypeaheadPlaceResult => ({
  id: 'place-1',
  name: 'Test Warehouse',
  address: '123 Main St',
  city: 'Dallas',
  state: 'TX',
  zip: '75001',
  facilityType: 'WAREHOUSE',
  contactName: 'John',
  contactPhone: '555-0100',
  latitude: 32.7767,
  longitude: -96.797,
  appointmentRequired: false,
  lumperRequired: false,
  ppeRequired: false,
  facilityHours: null,
  is24Hours: false,
  ...overrides,
});

const buildGeocodeSuggestion = (overrides: Partial<GeocodeSuggestion> = {}): GeocodeSuggestion => ({
  name: null,
  address: '456 Oak Ave',
  city: 'Houston',
  state: 'TX',
  zip: '77001',
  lat: 29.7604,
  lng: -95.3698,
  ...overrides,
});

const resultAt = (results: AddressSearchResult[], index: number): AddressSearchResult => {
  const item = results[index];
  if (item === undefined) {
    throw new Error(`No result at index ${index}`);
  }
  return item;
};

describe('addressSearchService', () => {
  const mockPlaceRepo = createMockPlaceRepo();
  const mockGeoProvider = createMockGeocodingProvider();
  const mockOrgQueries = createMockOrgQueries();
  const service = createAddressSearchService({
    placeRepository: mockPlaceRepo as unknown as PlaceRepositoryPort,
    geocodingProvider: mockGeoProvider,
    organizationQueries: mockOrgQueries,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (mockOrgQueries.findHeadquartersLocation as jest.Mock).mockResolvedValue(null);
  });

  it('searches Places only when query is shorter than 3 characters', async () => {
    const places = [buildPlaceResult()];
    (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue(places);

    const results = await service.search({
      organizationId: 'org-1',
      query: 'Da',
      limit: 10,
    });

    expect(mockPlaceRepo.typeahead).toHaveBeenCalledWith({
      organizationId: 'org-1',
      query: 'Da',
      limit: 10,
    });
    expect(mockGeoProvider.searchAddresses).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(resultAt(results, 0).source).toBe('SAVED');
  });

  it('skips geocoding when Places returns 3+ results', async () => {
    const places = [
      buildPlaceResult({ id: 'p1' }),
      buildPlaceResult({ id: 'p2' }),
      buildPlaceResult({ id: 'p3' }),
    ];
    (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue(places);

    const results = await service.search({
      organizationId: 'org-1',
      query: 'Dallas warehouse',
      limit: 10,
    });

    expect(mockGeoProvider.searchAddresses).not.toHaveBeenCalled();
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.source === 'SAVED')).toBe(true);
  });

  it('calls geocoding when fewer than 3 Place results for query >= 3 chars', async () => {
    const places = [buildPlaceResult()];
    const geocodeResults = [buildGeocodeSuggestion()];
    (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue(places);
    (mockGeoProvider.searchAddresses as jest.Mock).mockResolvedValue(geocodeResults);

    const results = await service.search({
      organizationId: 'org-1',
      query: 'Houston',
      limit: 10,
    });

    expect(mockGeoProvider.searchAddresses).toHaveBeenCalledWith(
      'Houston',
      9,
      [-98.5, 39.5],
    );
    expect(results).toHaveLength(2);
    expect(resultAt(results, 0).source).toBe('SAVED');
    expect(resultAt(results, 1).source).toBe('EXTERNAL');
    expect(resultAt(results, 1).id).toBe('ext-0');
  });

  it('returns Places-only results gracefully when geocoding fails', async () => {
    const places = [buildPlaceResult()];
    (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue(places);
    (mockGeoProvider.searchAddresses as jest.Mock).mockRejectedValue(new Error('AWS error'));

    const results = await service.search({
      organizationId: 'org-1',
      query: 'test address',
      limit: 10,
    });

    expect(results).toHaveLength(1);
    expect(resultAt(results, 0).source).toBe('SAVED');
  });

  it('ranks Places first when merging with external results', async () => {
    const places = [buildPlaceResult({ id: 'p1', name: 'Saved Place' })];
    const geocodeResults = [
      buildGeocodeSuggestion({ address: '100 Oak St', city: 'Austin', state: 'TX' }),
      buildGeocodeSuggestion({ address: '200 Elm St', city: 'San Antonio', state: 'TX' }),
    ];
    (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue(places);
    (mockGeoProvider.searchAddresses as jest.Mock).mockResolvedValue(geocodeResults);

    const results = await service.search({
      organizationId: 'org-1',
      query: 'test query',
      limit: 10,
    });

    expect(resultAt(results, 0).source).toBe('SAVED');
    expect(resultAt(results, 0).name).toBe('Saved Place');
    expect(resultAt(results, 1).source).toBe('EXTERNAL');
    expect(resultAt(results, 2).source).toBe('EXTERNAL');
  });

  it('deduplicates external results with identical city, state, and address', async () => {
    (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue([]);
    (mockGeoProvider.searchAddresses as jest.Mock).mockResolvedValue([
      buildGeocodeSuggestion({ address: '', city: 'Dallas', state: 'TX' }),
      buildGeocodeSuggestion({ address: '', city: 'Dallas', state: 'TX' }),
      buildGeocodeSuggestion({ address: '100 Main St', city: 'Dallas', state: 'TX' }),
    ]);

    const results = await service.search({
      organizationId: 'org-1',
      query: 'Dallas',
      limit: 10,
    });

    expect(results).toHaveLength(2);
    expect(resultAt(results, 0).address).toBe('');
    expect(resultAt(results, 1).address).toBe('100 Main St');
  });

  it('removes external results that match a saved place by city, state, and address', async () => {
    const places = [buildPlaceResult({ address: '123 Main St', city: 'Dallas', state: 'TX' })];
    (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue(places);
    (mockGeoProvider.searchAddresses as jest.Mock).mockResolvedValue([
      buildGeocodeSuggestion({ address: '123 Main St', city: 'Dallas', state: 'TX' }),
      buildGeocodeSuggestion({ address: '456 Oak Ave', city: 'Houston', state: 'TX' }),
    ]);

    const results = await service.search({
      organizationId: 'org-1',
      query: 'Dallas',
      limit: 10,
    });

    expect(results).toHaveLength(2);
    expect(resultAt(results, 0).source).toBe('SAVED');
    expect(resultAt(results, 1).source).toBe('EXTERNAL');
    expect(resultAt(results, 1).city).toBe('Houston');
  });

  it('uses suggestion.name as the external result name when AWS returns a POI', async () => {
    (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue([]);
    (mockGeoProvider.searchAddresses as jest.Mock).mockResolvedValue([
      buildGeocodeSuggestion({
        name: 'Walmart Supercenter',
        address: '455 E Wetmore Rd',
        city: 'Tucson',
        state: 'AZ',
      }),
    ]);

    const results = await service.search({
      organizationId: 'org-1',
      query: 'walmart tucson',
      limit: 10,
    });

    expect(resultAt(results, 0).name).toBe('Walmart Supercenter');
  });

  describe('biasPosition plumbing', () => {
    it('forwards [biasLng, biasLat] to provider when both are supplied', async () => {
      (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue([]);
      (mockGeoProvider.searchAddresses as jest.Mock).mockResolvedValue([]);

      await service.search({
        organizationId: 'org-1',
        query: 'walmart',
        limit: 10,
        biasLat: 40.73,
        biasLng: -73.94,
      });

      expect(mockGeoProvider.searchAddresses).toHaveBeenCalledWith(
        'walmart',
        10,
        [-73.94, 40.73],
      );
      expect(mockOrgQueries.findHeadquartersLocation).not.toHaveBeenCalled();
    });

    it('falls back to organization HQ when bias not supplied', async () => {
      (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue([]);
      (mockGeoProvider.searchAddresses as jest.Mock).mockResolvedValue([]);
      (mockOrgQueries.findHeadquartersLocation as jest.Mock).mockResolvedValue({
        latitude: 32.7767,
        longitude: -96.797,
      });

      await service.search({
        organizationId: 'org-1',
        query: 'walmart',
        limit: 10,
      });

      expect(mockOrgQueries.findHeadquartersLocation).toHaveBeenCalledWith('org-1');
      expect(mockGeoProvider.searchAddresses).toHaveBeenCalledWith(
        'walmart',
        10,
        [-96.797, 32.7767],
      );
    });

    it('uses [-98.5, 39.5] default when neither bias nor org HQ are set', async () => {
      (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue([]);
      (mockGeoProvider.searchAddresses as jest.Mock).mockResolvedValue([]);
      (mockOrgQueries.findHeadquartersLocation as jest.Mock).mockResolvedValue({
        latitude: null,
        longitude: null,
      });

      await service.search({
        organizationId: 'org-1',
        query: 'walmart',
        limit: 10,
      });

      expect(mockGeoProvider.searchAddresses).toHaveBeenCalledWith(
        'walmart',
        10,
        [-98.5, 39.5],
      );
    });

    it('uses default fallback when org lookup returns null', async () => {
      (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue([]);
      (mockGeoProvider.searchAddresses as jest.Mock).mockResolvedValue([]);
      (mockOrgQueries.findHeadquartersLocation as jest.Mock).mockResolvedValue(null);

      await service.search({
        organizationId: 'org-1',
        query: 'walmart',
        limit: 10,
      });

      expect(mockGeoProvider.searchAddresses).toHaveBeenCalledWith(
        'walmart',
        10,
        [-98.5, 39.5],
      );
    });
  });

  it('falls back to suggestion.address as the external result name when name is null', async () => {
    (mockPlaceRepo.typeahead as jest.Mock).mockResolvedValue([]);
    (mockGeoProvider.searchAddresses as jest.Mock).mockResolvedValue([
      buildGeocodeSuggestion({
        name: null,
        address: '789 Pine St',
        city: 'Phoenix',
        state: 'AZ',
      }),
    ]);

    const results = await service.search({
      organizationId: 'org-1',
      query: '789 pine',
      limit: 10,
    });

    expect(resultAt(results, 0).name).toBe('789 Pine St');
  });
});
