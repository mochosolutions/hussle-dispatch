import Decimal from 'decimal.js';
import type Redis from 'ioredis';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors';
import { createDriverService } from '../driverService';

const buildDriver = () => ({
  id: '0e1d0809-f323-4698-9dc2-f84bf8e6a968',
  carrierId: '5d153f6d-d8e6-4928-8f9b-652f20e9a8b2',
  firstName: 'Terry',
  lastName: 'Driver',
  phone: '555-555-1000',
  email: 'driver@example.com',
  licenseNumber: 'CDL12345',
  licenseState: 'TX',
  licenseExpiry: new Date('2027-01-01T00:00:00.000Z'),
  endorsements: null,
  availableHours: new Decimal('9.5'),
  currentCity: 'Dallas',
  currentState: 'TX',
  currentLatitude: null,
  currentLongitude: null,
  homeBaseCity: 'Dallas',
  homeBaseState: 'TX',
  maxDaysOut: 5,
  preferredLanes: [
    {
      originState: 'TX',
      destState: 'OK',
      originCity: 'Dallas',
      destCity: 'Tulsa',
    },
  ],
  noGoZones: [
    {
      state: 'NY',
      city: 'New York',
    },
  ],
  isAvailable: true,
  status: 'active',
  notes: null,
  createdAt: new Date('2026-03-01T00:00:00.000Z'),
  updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  deletedAt: null,
});

describe('driverService', () => {
  const mockDriverRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockCarrierRepository = {
    findActiveByIdForOrg: jest.fn(),
  };

  const mockLoadRepository = {
    findBlockingLoadIdsByDriver: jest.fn(),
  };

  const mockLoadQueryPort = {
    getLoadsByDriverId: jest.fn(),
    getLoadsByVehicleId: jest.fn(),
  };

  const mockGetCityCoords = jest.fn();

  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const driverService = createDriverService({
    driverRepository: mockDriverRepository,
    carrierRepository: mockCarrierRepository,
    loadRepository: mockLoadRepository,
    loadQueryPort: mockLoadQueryPort,
    redis: {} as Redis,
    getCityCoords: mockGetCityCoords,
    logger: mockLogger,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks owner_operator role from creating drivers', async () => {
    await expect(
      driverService.createDriver({
        organizationId: 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad',
        role: 'owner_operator',
        input: {
          carrierId: '5d153f6d-d8e6-4928-8f9b-652f20e9a8b2',
          firstName: 'Blocked',
          lastName: 'Driver',
          payType: 'PERCENTAGE',
          payRate: 25,
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns not found when creating a driver for missing carrier', async () => {
    mockCarrierRepository.findActiveByIdForOrg.mockResolvedValue(false);

    await expect(
      driverService.createDriver({
        organizationId: 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad',
        role: 'admin',
        input: {
          carrierId: '5d153f6d-d8e6-4928-8f9b-652f20e9a8b2',
          firstName: 'New',
          lastName: 'Driver',
          payType: 'PERCENTAGE',
          payRate: 25,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns driver by id for matching organization scope', async () => {
    mockDriverRepository.findById.mockResolvedValue(buildDriver());

    const result = await driverService.getDriverById({
      id: '0e1d0809-f323-4698-9dc2-f84bf8e6a968',
      organizationId: 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad',
      role: 'dispatcher',
    });

    expect(result.firstName).toBe('Terry');
    expect(result.lastName).toBe('Driver');
    expect(result.availableHours).toEqual(new Decimal('9.5'));
  });

  it('blocks soft-delete when loads are active before delivered', async () => {
    mockDriverRepository.findById.mockResolvedValue(buildDriver());
    mockLoadRepository.findBlockingLoadIdsByDriver.mockResolvedValue(['load-1', 'load-2']);

    await expect(
      driverService.deleteDriver({
        id: '0e1d0809-f323-4698-9dc2-f84bf8e6a968',
        organizationId: 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad',
        role: 'admin',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  describe('updateDriver geocoding', () => {
    const ORG_ID = 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad';
    const DRIVER_ID = '0e1d0809-f323-4698-9dc2-f84bf8e6a968';

    it('geocodes when city/state changed and coords found', async () => {
      // Arrange
      mockDriverRepository.findById.mockResolvedValue(buildDriver());
      mockDriverRepository.update.mockResolvedValue(buildDriver());
      mockGetCityCoords.mockResolvedValue({ lat: 29.76, lng: -95.37 });

      // Act
      await driverService.updateDriver({
        id: DRIVER_ID,
        organizationId: ORG_ID,
        role: 'admin',
        input: { currentCity: 'Houston', currentState: 'TX' },
      });

      // Assert
      expect(mockGetCityCoords).toHaveBeenCalledWith({}, 'TX', 'Houston');
      expect(mockDriverRepository.update).toHaveBeenCalledWith(
        DRIVER_ID,
        ORG_ID,
        expect.objectContaining({
          currentCity: 'Houston',
          currentState: 'TX',
          currentLatitude: 29.76,
          currentLongitude: -95.37,
        }),
      );
    });

    it('proceeds without coords when geocode returns null', async () => {
      // Arrange
      mockDriverRepository.findById.mockResolvedValue(buildDriver());
      mockDriverRepository.update.mockResolvedValue(buildDriver());
      mockGetCityCoords.mockResolvedValue(null);

      // Act
      await driverService.updateDriver({
        id: DRIVER_ID,
        organizationId: ORG_ID,
        role: 'admin',
        input: { currentCity: 'Nowhere', currentState: 'ZZ' },
      });

      // Assert
      expect(mockGetCityCoords).toHaveBeenCalled();
      expect(mockDriverRepository.update).toHaveBeenCalledWith(
        DRIVER_ID,
        ORG_ID,
        expect.objectContaining({
          currentCity: 'Nowhere',
          currentState: 'ZZ',
        }),
      );
      const updateInput = mockDriverRepository.update.mock.calls[0][2];
      expect(updateInput).not.toHaveProperty('currentLatitude');
      expect(updateInput).not.toHaveProperty('currentLongitude');
    });

    it('clears coords when city/state set to null', async () => {
      // Arrange
      mockDriverRepository.findById.mockResolvedValue(buildDriver());
      mockDriverRepository.update.mockResolvedValue(buildDriver());

      // Act
      await driverService.updateDriver({
        id: DRIVER_ID,
        organizationId: ORG_ID,
        role: 'admin',
        input: { currentCity: null, currentState: null },
      });

      // Assert
      expect(mockGetCityCoords).not.toHaveBeenCalled();
      expect(mockDriverRepository.update).toHaveBeenCalledWith(
        DRIVER_ID,
        ORG_ID,
        expect.objectContaining({
          currentLatitude: null,
          currentLongitude: null,
        }),
      );
    });

    it('skips geocoding when only unrelated fields updated', async () => {
      // Arrange
      mockDriverRepository.findById.mockResolvedValue(buildDriver());
      mockDriverRepository.update.mockResolvedValue(buildDriver());

      // Act
      await driverService.updateDriver({
        id: DRIVER_ID,
        organizationId: ORG_ID,
        role: 'admin',
        input: { notes: 'test' },
      });

      // Assert
      expect(mockGetCityCoords).not.toHaveBeenCalled();
    });

    it('skips geocoding when city/state unchanged', async () => {
      // Arrange — same city/state as buildDriver default (Dallas, TX)
      mockDriverRepository.findById.mockResolvedValue(buildDriver());
      mockDriverRepository.update.mockResolvedValue(buildDriver());

      // Act
      await driverService.updateDriver({
        id: DRIVER_ID,
        organizationId: ORG_ID,
        role: 'admin',
        input: { currentCity: 'Dallas', currentState: 'TX' },
      });

      // Assert
      expect(mockGetCityCoords).not.toHaveBeenCalled();
    });
  });
});
