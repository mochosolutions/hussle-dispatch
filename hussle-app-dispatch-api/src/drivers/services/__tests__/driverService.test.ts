import Decimal from 'decimal.js';
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

  const driverService = createDriverService({
    driverRepository: mockDriverRepository,
    carrierRepository: mockCarrierRepository,
    loadRepository: mockLoadRepository,
    loadQueryPort: mockLoadQueryPort,
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
});
