import type { Place } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  StopResolutionStatus,
  WarningCode,
  createResolveStopToPlace,
} from '../resolveStopToPlace';
import type {
  ResolveStopInput,
} from '../resolveStopToPlace';
import type {
  GeocodeResult,
  GeocodingProviderPort,
} from '@/shared/providers/awsLocationProviderTypes';
import type {
  CreatePlaceInput,
  DedupeKeyParams,
  PlaceRepositoryPort,
} from '../../types/placeTypes';
import { normalize } from '../../utils/normalize';

const ORG_ID = 'org-1';

const createMockRepo = (): jest.Mocked<
  Pick<
    PlaceRepositoryPort,
    'findByDedupeKey' | 'createOnConflictDoNothing' | 'update'
  >
> => ({
  findByDedupeKey: jest.fn(),
  createOnConflictDoNothing: jest.fn(),
  update: jest.fn(),
});

const createMockProvider = (): jest.Mocked<GeocodingProviderPort> => ({
  searchAddresses: jest.fn(),
  geocode: jest.fn(),
});

const createMockLogger = () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const buildPlace = (overrides: Partial<Place> = {}): Place => ({
  id: 'place-1',
  organizationId: ORG_ID,
  contactId: null,
  customerId: null,
  name: 'Existing Place',
  address: '123 Main St',
  address2: null,
  city: 'Dallas',
  state: 'TX',
  zip: '75001',
  unit: null,
  source: 'USER',
  awsAddressNumber: '123',
  awsStreetBaseName: 'Main',
  awsStreetType: 'St',
  awsStreetPrefix: null,
  awsRegion: 'TX',
  awsPostalCode5: '75001',
  latitude: new Decimal('32.7767') as unknown as Place['latitude'],
  longitude: new Decimal('-96.797') as unknown as Place['longitude'],
  geoSource: 'AUTO',
  facilityType: null,
  facilityHours: null,
  is24Hours: false,
  timezone: null,
  appointmentRequired: false,
  dockType: null,
  contactName: null,
  contactPhone: null,
  contactEmail: null,
  checkInProcedures: null,
  lumperRequired: false,
  ppeRequired: false,
  notes: null,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const buildGeocode = (overrides: Partial<GeocodeResult> = {}): GeocodeResult => ({
  matchScore: 0.95,
  type: 'PointAddress',
  title: '123 Main St, Dallas, TX 75001',
  addressNumber: '123',
  streetBaseName: 'Main',
  streetType: 'St',
  streetPrefix: null,
  city: 'Dallas',
  region: 'TX',
  postalCode5: '75001',
  unit: null,
  lat: 32.7767,
  lng: -96.797,
  ...overrides,
});

const buildStop = (overrides: Partial<ResolveStopInput> = {}): ResolveStopInput => ({
  facilityName: null,
  address: '123 Main St',
  city: 'Dallas',
  state: 'TX',
  zip: '75001',
  contactName: null,
  contactPhone: null,
  notes: null,
  sequence: 1,
  ...overrides,
});

describe('resolveStopToPlace', () => {
  let repo: ReturnType<typeof createMockRepo>;
  let provider: ReturnType<typeof createMockProvider>;
  let logger: ReturnType<typeof createMockLogger>;
  let resolve: ReturnType<typeof createResolveStopToPlace>;

  beforeEach(() => {
    repo = createMockRepo();
    provider = createMockProvider();
    logger = createMockLogger();
    resolve = createResolveStopToPlace({
      placeRepo: repo as unknown as PlaceRepositoryPort,
      geocodingProvider: provider,
      logger,
    });
  });

  it('returns RESOLVED with no provider call when explicit placeId is supplied', async () => {
    const result = await resolve(buildStop({ placeId: 'place-99' }), ORG_ID);

    expect(result).toEqual({
      placeId: 'place-99',
      resolutionStatus: StopResolutionStatus.RESOLVED,
      warning: null,
    });
    expect(provider.geocode).not.toHaveBeenCalled();
    expect(repo.findByDedupeKey).not.toHaveBeenCalled();
  });

  it('returns RESOLVED via tier-1 dedupe and soft-fills missing contact fields without flipping source', async () => {
    const existing = buildPlace({
      id: 'p-existing',
      contactName: null,
      contactPhone: null,
      notes: null,
      source: 'USER',
    });
    repo.findByDedupeKey.mockResolvedValueOnce(existing);

    const result = await resolve(
      buildStop({
        facilityName: 'Walmart DC',
        contactName: 'Jane',
        contactPhone: '555-0100',
        notes: 'gate code 1234',
      }),
      ORG_ID,
    );

    expect(result.placeId).toBe('p-existing');
    expect(result.resolutionStatus).toBe(StopResolutionStatus.RESOLVED);
    expect(result.warning).toBeNull();
    expect(repo.update).toHaveBeenCalledWith('p-existing', {
      contactName: 'Jane',
      contactPhone: '555-0100',
      notes: 'gate code 1234',
    });
    // source must NOT appear in the soft-fill update payload
    const updatePayload = repo.update.mock.calls[0]?.[1];
    expect(updatePayload).not.toHaveProperty('source');
    expect(provider.geocode).not.toHaveBeenCalled();
  });

  it('does not soft-fill when stop fields are null or place fields already populated', async () => {
    const existing = buildPlace({
      id: 'p-existing',
      contactName: 'Already Set',
      contactPhone: '555-9999',
      notes: 'pre-existing',
    });
    repo.findByDedupeKey.mockResolvedValueOnce(existing);

    await resolve(
      buildStop({
        facilityName: 'Walmart DC',
        contactName: 'Jane',
        contactPhone: '555-0100',
        notes: 'new',
      }),
      ORG_ID,
    );

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('creates a new Place with source AUTO when both dedupe tiers miss + confident geocode', async () => {
    repo.findByDedupeKey.mockResolvedValue(null);
    provider.geocode.mockResolvedValue(buildGeocode());
    const created = buildPlace({ id: 'p-new', source: 'AUTO' });
    repo.createOnConflictDoNothing.mockResolvedValue(created);

    const result = await resolve(buildStop({ facilityName: 'New DC' }), ORG_ID);

    expect(result.placeId).toBe('p-new');
    expect(result.resolutionStatus).toBe(StopResolutionStatus.RESOLVED);
    expect(repo.createOnConflictDoNothing).toHaveBeenCalledTimes(1);
    const args = repo.createOnConflictDoNothing.mock.calls[0];
    expect(args).toBeDefined();
    if (args === undefined) throw new Error('unreachable');
    const [orgId, input, key] = args as [string, CreatePlaceInput, DedupeKeyParams];
    expect(orgId).toBe(ORG_ID);
    expect(input.source).toBe('AUTO');
    expect(input.awsAddressNumber).toBe('123');
    expect(input.awsStreetBaseName).toBe('Main');
    expect(input.awsStreetType).toBe('St');
    expect(input.awsRegion).toBe('TX');
    expect(input.awsPostalCode5).toBe('75001');
    expect(input.latitude).toBe(32.7767);
    expect(input.longitude).toBe(-96.797);
    expect(key.name).toBe('New DC');
  });

  it('returns RESOLVED via tier-2 dedupe when AWS-canonical key matches an existing Place', async () => {
    const existing = buildPlace({ id: 'p-aws-existing' });
    // First call (tier-1) returns null; second call (tier-2) returns the row.
    repo.findByDedupeKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existing);
    provider.geocode.mockResolvedValue(buildGeocode());

    const result = await resolve(buildStop(), ORG_ID);

    expect(result.placeId).toBe('p-aws-existing');
    expect(result.resolutionStatus).toBe(StopResolutionStatus.RESOLVED);
    expect(repo.createOnConflictDoNothing).not.toHaveBeenCalled();
  });

  it('returns AMBIGUOUS with STOP_AMBIGUOUS_ADDRESS warning when match score < 0.7', async () => {
    repo.findByDedupeKey.mockResolvedValue(null);
    provider.geocode.mockResolvedValue(buildGeocode({ matchScore: 0.65 }));

    const result = await resolve(buildStop({ sequence: 3 }), ORG_ID);

    expect(result.placeId).toBeNull();
    expect(result.resolutionStatus).toBe(StopResolutionStatus.AMBIGUOUS);
    expect(result.warning?.code).toBe(WarningCode.STOP_AMBIGUOUS_ADDRESS);
    expect(result.warning?.stopSequence).toBe(3);
  });

  it('returns UNRESOLVED with STOP_NOT_GEOCODED when geocode type is rejected (Locality at score=1)', async () => {
    repo.findByDedupeKey.mockResolvedValue(null);
    provider.geocode.mockResolvedValue(
      buildGeocode({ type: 'Locality', matchScore: 1 }),
    );

    const result = await resolve(buildStop({ sequence: 2 }), ORG_ID);

    expect(result.placeId).toBeNull();
    expect(result.resolutionStatus).toBe(StopResolutionStatus.UNRESOLVED);
    expect(result.warning?.code).toBe(WarningCode.STOP_NOT_GEOCODED);
    expect(result.warning?.stopSequence).toBe(2);
  });

  it('returns UNRESOLVED with GEOCODER_UNAVAILABLE when provider throws', async () => {
    repo.findByDedupeKey.mockResolvedValue(null);
    provider.geocode.mockRejectedValue(new Error('AWS down'));

    const result = await resolve(buildStop({ sequence: 5 }), ORG_ID);

    expect(result.placeId).toBeNull();
    expect(result.resolutionStatus).toBe(StopResolutionStatus.UNRESOLVED);
    expect(result.warning?.code).toBe(WarningCode.GEOCODER_UNAVAILABLE);
    expect(result.warning?.stopSequence).toBe(5);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('returns UNRESOLVED with STOP_PARTIAL_ADDRESS when street-level input is missing', async () => {
    repo.findByDedupeKey.mockResolvedValue(null);

    const result = await resolve(
      buildStop({ address: null, city: 'Dallas', state: 'TX', sequence: 7 }),
      ORG_ID,
    );

    expect(result.placeId).toBeNull();
    expect(result.resolutionStatus).toBe(StopResolutionStatus.UNRESOLVED);
    expect(result.warning?.code).toBe(WarningCode.STOP_PARTIAL_ADDRESS);
    expect(result.warning?.stopSequence).toBe(7);
    expect(provider.geocode).not.toHaveBeenCalled();
  });

  it('returns UNRESOLVED with STOP_NOT_GEOCODED when provider returns null', async () => {
    repo.findByDedupeKey.mockResolvedValue(null);
    provider.geocode.mockResolvedValue(null);

    const result = await resolve(buildStop({ sequence: 9 }), ORG_ID);

    expect(result.resolutionStatus).toBe(StopResolutionStatus.UNRESOLVED);
    expect(result.warning?.code).toBe(WarningCode.STOP_NOT_GEOCODED);
  });

  it('uses createOnConflictDoNothing winner when concurrent insert race occurs', async () => {
    // After both dedupe lookups miss, a sibling writer wins the race; the
    // repo returns the winning row from its internal re-read.
    repo.findByDedupeKey.mockResolvedValue(null);
    provider.geocode.mockResolvedValue(buildGeocode());
    const winner = buildPlace({ id: 'p-winner' });
    repo.createOnConflictDoNothing.mockResolvedValue(winner);

    const result = await resolve(buildStop(), ORG_ID);

    expect(result.placeId).toBe('p-winner');
    expect(result.resolutionStatus).toBe(StopResolutionStatus.RESOLVED);
  });

  describe('composeFallbackName branches', () => {
    it('uses stop.facilityName when present', async () => {
      repo.findByDedupeKey.mockResolvedValue(null);
      provider.geocode.mockResolvedValue(
        buildGeocode({ title: 'AWS Title' }),
      );
      const created = buildPlace({ id: 'p-new', name: 'My Facility' });
      repo.createOnConflictDoNothing.mockResolvedValue(created);

      await resolve(buildStop({ facilityName: 'My Facility' }), ORG_ID);

      const args = repo.createOnConflictDoNothing.mock.calls[0];
      if (args === undefined) throw new Error('unreachable');
      const input = args[1] as CreatePlaceInput;
      expect(input.name).toBe('My Facility');
    });

    it('uses geocode.title when stop.facilityName is null', async () => {
      repo.findByDedupeKey.mockResolvedValue(null);
      provider.geocode.mockResolvedValue(
        buildGeocode({ title: 'AWS Title' }),
      );
      repo.createOnConflictDoNothing.mockResolvedValue(buildPlace({ id: 'p-new' }));

      await resolve(buildStop({ facilityName: null }), ORG_ID);

      const args = repo.createOnConflictDoNothing.mock.calls[0];
      if (args === undefined) throw new Error('unreachable');
      const input = args[1] as CreatePlaceInput;
      expect(input.name).toBe('AWS Title');
    });

    it('composes from address/city/state/zip when both facilityName and title are null', async () => {
      repo.findByDedupeKey.mockResolvedValue(null);
      provider.geocode.mockResolvedValue(buildGeocode({ title: null }));
      repo.createOnConflictDoNothing.mockResolvedValue(buildPlace({ id: 'p-new' }));

      await resolve(
        buildStop({
          facilityName: null,
          address: '500 Oak Blvd',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
        }),
        ORG_ID,
      );

      const args = repo.createOnConflictDoNothing.mock.calls[0];
      if (args === undefined) throw new Error('unreachable');
      const input = args[1] as CreatePlaceInput;
      expect(input.name).toContain('500 Oak Blvd');
      expect(input.name).toContain('Austin');
      expect(input.name).toContain('TX');
      expect(input.name).toContain('78701');
    });

    it('includes ZIP in composed fallback name', async () => {
      repo.findByDedupeKey.mockResolvedValue(null);
      provider.geocode.mockResolvedValue(buildGeocode({ title: null }));
      repo.createOnConflictDoNothing.mockResolvedValue(buildPlace({ id: 'p-new' }));

      await resolve(
        buildStop({
          facilityName: null,
          address: '1 Beacon St',
          city: 'Boston',
          state: 'MA',
          zip: '02110',
        }),
        ORG_ID,
      );

      const args = repo.createOnConflictDoNothing.mock.calls[0];
      if (args === undefined) throw new Error('unreachable');
      const input = args[1] as CreatePlaceInput;
      expect(input.name).toMatch(/02110/);
    });
  });

  describe('normalize() helper', () => {
    it('case-folds', () => {
      expect(normalize('WALMART')).toBe('walmart');
    });
    it('trims edges', () => {
      expect(normalize('  walmart  ')).toBe('walmart');
    });
    it('collapses internal whitespace', () => {
      expect(normalize('walmart   dc')).toBe('walmart dc');
    });
    it('handles null', () => {
      expect(normalize(null)).toBe('');
    });
    it('handles undefined', () => {
      expect(normalize(undefined)).toBe('');
    });
    it('handles tabs as whitespace', () => {
      expect(normalize('ACME\tCOLD\tSTORAGE')).toBe('acme cold storage');
    });
  });
});
