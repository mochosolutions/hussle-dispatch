import Decimal from 'decimal.js';
import { NotFoundError } from '@/shared/errors';
import { haversineDistance } from '@/shared/geoLookup';
import { calculateDeadheadTo } from '../deadheadToService';
import type { DeadheadToServiceDeps, DeadheadToServiceInput } from '../../types/deadheadToTypes';

const ROAD_FACTOR = 1.3;

const ATLANTA = { lat: 33.749, lng: -84.388 };
const LOS_ANGELES = { lat: 34.052, lng: -118.244 };

const buildBaseDriver = () => ({
  id: 'driver-1',
  carrierId: 'carrier-1',
  firstName: 'Test',
  lastName: 'Driver',
  phone: null,
  email: null,
  licenseType: null,
  licenseNumber: null,
  licenseState: null,
  licenseExpiry: null,
  endorsements: null,
  availableHours: null,
  currentCity: null,
  currentState: null,
  currentLatitude: null,
  currentLongitude: null,
  homeBaseCity: null,
  homeBaseState: null,
  maxDaysOut: null,
  preferredLanes: null,
  noGoZones: null,
  isAvailable: true,
  status: 'active',
  notes: null,
  timezone: null,
  organizationId: 'org-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
});

const buildInput = (overrides?: Partial<DeadheadToServiceInput>): DeadheadToServiceInput => ({
  driverId: 'driver-1',
  organizationId: 'org-1',
  role: 'ADMIN',
  targetLat: LOS_ANGELES.lat,
  targetLng: LOS_ANGELES.lng,
  ...overrides,
});

describe('calculateDeadheadTo', () => {
  const mockFindDriver = jest.fn();
  const mockGetCityCoords = jest.fn();
  const mockRedis = {} as DeadheadToServiceDeps['redis'];

  const deps: DeadheadToServiceDeps = {
    findDriver: mockFindDriver,
    getCityCoords: mockGetCityCoords,
    redis: mockRedis,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns deadheadMiles from coordinates when driver has lat/lng', async () => {
    // Arrange
    const driver = {
      ...buildBaseDriver(),
      currentLatitude: new Decimal(ATLANTA.lat),
      currentLongitude: new Decimal(ATLANTA.lng),
    };
    mockFindDriver.mockResolvedValue(driver);

    // Act
    const result = await calculateDeadheadTo(buildInput(), deps);

    // Assert
    const expectedMiles = Math.round(
      haversineDistance({ from: ATLANTA, to: LOS_ANGELES }) * ROAD_FACTOR,
    );
    expect(result.deadheadMiles).toBe(expectedMiles);
    expect(result.isEstimated).toBe(true);
    expect(result.source).toBe('coordinates');
    expect(mockGetCityCoords).not.toHaveBeenCalled();
  });

  it('geocodes and returns deadheadMiles when driver has city/state only', async () => {
    // Arrange
    const driver = {
      ...buildBaseDriver(),
      currentCity: 'Atlanta',
      currentState: 'GA',
    };
    mockFindDriver.mockResolvedValue(driver);
    mockGetCityCoords.mockResolvedValue(ATLANTA);

    // Act
    const result = await calculateDeadheadTo(buildInput(), deps);

    // Assert
    const expectedMiles = Math.round(
      haversineDistance({ from: ATLANTA, to: LOS_ANGELES }) * ROAD_FACTOR,
    );
    expect(result.deadheadMiles).toBe(expectedMiles);
    expect(result.isEstimated).toBe(true);
    expect(result.source).toBe('geocoded');
    expect(mockGetCityCoords).toHaveBeenCalledWith(mockRedis, 'GA', 'Atlanta');
  });

  it('returns null deadheadMiles when driver has no location', async () => {
    // Arrange
    const driver = buildBaseDriver();
    mockFindDriver.mockResolvedValue(driver);

    // Act
    const result = await calculateDeadheadTo(buildInput(), deps);

    // Assert
    expect(result.deadheadMiles).toBeNull();
    expect(result.isEstimated).toBe(false);
    expect(result.source).toBeNull();
  });

  it('returns null deadheadMiles when getCityCoords returns null', async () => {
    // Arrange
    const driver = {
      ...buildBaseDriver(),
      currentCity: 'UnknownCity',
      currentState: 'XX',
    };
    mockFindDriver.mockResolvedValue(driver);
    mockGetCityCoords.mockResolvedValue(null);

    // Act
    const result = await calculateDeadheadTo(buildInput(), deps);

    // Assert
    expect(result.deadheadMiles).toBeNull();
    expect(result.isEstimated).toBe(false);
    expect(result.source).toBeNull();
  });

  it('throws NotFoundError when driver does not exist', async () => {
    // Arrange
    mockFindDriver.mockResolvedValue(null);

    // Act & Assert
    await expect(calculateDeadheadTo(buildInput(), deps)).rejects.toThrow(NotFoundError);
  });
});
