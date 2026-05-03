import type Redis from 'ioredis';
import type { Place } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { createPlaceService } from '../placeService';
import type { PlaceRepositoryPort } from '../../types/placeTypes';

jest.mock('@/shared/geoLookup', () => ({
  getCityCoords: jest.fn().mockResolvedValue(null),
}));

const ORG_ID = 'org-1';

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
  awsStreetBaseName: 'main',
  awsStreetType: 'St',
  awsStreetPrefix: null,
  awsRegion: 'TX',
  awsPostalCode5: '75001',
  latitude: new Decimal('32.7767'),
  longitude: new Decimal('-96.797'),
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
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  ...overrides,
});

const createMockRepo = (): jest.Mocked<PlaceRepositoryPort> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByDedupeKey: jest.fn(),
  createOnConflictDoNothing: jest.fn(),
  list: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  typeahead: jest.fn(),
  findLoadsAtFacility: jest.fn(),
});

const createMockRedis = (): Redis => ({}) as unknown as Redis;

describe('placeService', () => {
  let mockRepo: jest.Mocked<PlaceRepositoryPort>;
  let service: ReturnType<typeof createPlaceService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = createMockRepo();
    service = createPlaceService({
      placeRepository: mockRepo,
      redis: createMockRedis(),
    });
  });

  describe('createPlace', () => {
    it('forces source=USER even when client supplies source=AUTO', async () => {
      // Arrange
      const created = buildPlace({ source: 'USER' });
      mockRepo.create.mockResolvedValue(created);

      // Act
      await service.createPlace({
        organizationId: ORG_ID,
        role: 'admin',
        input: {
          name: 'New Place',
          city: 'Dallas',
          state: 'TX',
          source: 'AUTO',
        },
      });

      // Assert
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      expect(mockRepo.create).toHaveBeenCalledWith(
        ORG_ID,
        expect.objectContaining({ source: 'USER' }),
      );
    });
  });

  describe('updatePlace', () => {
    it('flips source to USER when patching an AUTO-created place', async () => {
      // Arrange
      const existing = buildPlace({ source: 'AUTO', city: 'Dallas', state: 'TX' });
      mockRepo.findById.mockResolvedValue(existing);
      mockRepo.update.mockResolvedValue({ ...existing, source: 'USER', name: 'Renamed' });

      // Act
      await service.updatePlace({
        id: existing.id,
        organizationId: ORG_ID,
        role: 'admin',
        input: { name: 'Renamed' },
      });

      // Assert
      expect(mockRepo.update).toHaveBeenCalledTimes(1);
      expect(mockRepo.update).toHaveBeenCalledWith(
        existing.id,
        expect.objectContaining({ source: 'USER', name: 'Renamed' }),
      );
    });

    it('does not include source in update payload when patching a USER place', async () => {
      // Arrange
      const existing = buildPlace({ source: 'USER', city: 'Dallas', state: 'TX' });
      mockRepo.findById.mockResolvedValue(existing);
      mockRepo.update.mockResolvedValue({ ...existing, name: 'Renamed' });

      // Act
      await service.updatePlace({
        id: existing.id,
        organizationId: ORG_ID,
        role: 'admin',
        input: { name: 'Renamed' },
      });

      // Assert
      expect(mockRepo.update).toHaveBeenCalledTimes(1);
      expect(mockRepo.update).toHaveBeenCalledWith(
        existing.id,
        expect.not.objectContaining({ source: expect.anything() }),
      );
      expect(mockRepo.update).toHaveBeenCalledWith(
        existing.id,
        expect.objectContaining({ name: 'Renamed' }),
      );
    });
  });

  describe('listPlaces', () => {
    it('forwards source=AUTO filter to the repository', async () => {
      // Arrange
      mockRepo.list.mockResolvedValue([]);
      mockRepo.count.mockResolvedValue(0);

      // Act
      await service.listPlaces({
        organizationId: ORG_ID,
        role: 'admin',
        query: { page: '1', limit: '20' },
        filters: { source: 'AUTO' },
      });

      // Assert
      expect(mockRepo.list).toHaveBeenCalledTimes(1);
      expect(mockRepo.list).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ source: 'AUTO' }),
        }),
      );
    });
  });
});
