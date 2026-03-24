import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AssignmentValidationError } from '../../../shared/errors';
import { createLoadService } from '../loadService';
import type {
  CarrierAssignmentQueryPort,
  DriverAssignmentQueryPort,
  LoadRepoPort,
  LoadWithRelations,
  OrgSettingsQueryPort,
  VehicleAssignmentQueryPort,
} from '../../types/loadTypes';

const buildLoad = (overrides?: Partial<LoadWithRelations>) => {
  const baseLoad = {
    id: 'load-1',
    organizationId: 'org-1',
    loadNumber: 'L-1001',
    carrierId: 'carrier-1',
    driverId: 'driver-1',
    vehicleId: 'vehicle-1',
    contactId: null,
    externalRefNumber: null,
    equipmentType: null,
    isHazmat: false,
    isTarp: false,
    isTeamDriver: false,
    commodity: null,
    weight: null,
    pieceCount: null,
    loadedMiles: null,
    deadheadMiles: null,
    totalMiles: null,
    customerRate: null,
    carrierRate: null,
    dispatchFee: null,
    partnerSplit: null,
    ratePerMile: null,
    status: 'BOOKED',
    rateConReceivedAt: null,
    bolUnsignedAt: null,
    bolSignedAt: null,
    dispatcherNotes: null,
    driverInstructions: null,
    customerId: null,
    scrapedLoadId: null,
    plannedNextLoadRef: null,
    createdByUserId: null,
    updatedByUserId: null,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    deletedAt: null,
    stops: [],
    carrier: null,
    driver: null,
    vehicle: null,
    contact: null,
    customer: null,
    statusHistory: [],
    checkCalls: [],
    accessorialCharges: [],
    invoiceReadiness: 'NOT_READY',
  } satisfies LoadWithRelations;

  return { ...baseLoad, ...overrides };
};

describe('loadService assignment validation', () => {
  const mockLoadRepository: jest.Mocked<LoadRepoPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    findBlockingLoadIdsByDriver: jest.fn(),
    findBlockingLoadIdsByVehicle: jest.fn(),
    softDelete: jest.fn(),
    createCheckCall: jest.fn(),
    listCheckCalls: jest.fn(),
    listStatusHistory: jest.fn(),
    listDocuments: jest.fn(),
    findLastDeliveryCoordinates: jest.fn(),
    findFirstPickupCoordinates: jest.fn(),
  };

  const mockOrgSettingsQuery: jest.Mocked<OrgSettingsQueryPort> = {
    getProhibitedCommodities: jest.fn(),
  };

  const mockCarrierAssignmentQuery: jest.Mocked<CarrierAssignmentQueryPort> = {
    findDispatchableById: jest.fn(),
  };

  const mockDriverAssignmentQuery: jest.Mocked<DriverAssignmentQueryPort> = {
    findAssignableById: jest.fn(),
  };

  const mockVehicleAssignmentQuery: jest.Mocked<VehicleAssignmentQueryPort> = {
    findAssignableById: jest.fn(),
  };

  const loadService = createLoadService({
    loadRepository: mockLoadRepository,
    orgSettingsQuery: mockOrgSettingsQuery,
    carrierAssignmentQuery: mockCarrierAssignmentQuery,
    driverAssignmentQuery: mockDriverAssignmentQuery,
    vehicleAssignmentQuery: mockVehicleAssignmentQuery,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrgSettingsQuery.getProhibitedCommodities.mockResolvedValue([]);
    mockLoadRepository.findById.mockResolvedValue(buildLoad());
    mockLoadRepository.findBlockingLoadIdsByDriver.mockResolvedValue([]);
    mockLoadRepository.findBlockingLoadIdsByVehicle.mockResolvedValue([]);
    mockLoadRepository.findLastDeliveryCoordinates.mockResolvedValue(null);
    mockLoadRepository.findFirstPickupCoordinates.mockResolvedValue(null);
    mockCarrierAssignmentQuery.findDispatchableById.mockResolvedValue({
      id: 'carrier-1',
      name: 'Fleet Carrier',
      type: 'COMPANY_ASSET',
      dispatchAgreementOnFile: true,
      insuranceCertOnFile: true,
      insuranceExpiry: null,
      w9OnFile: true,
    });
    mockDriverAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'driver-1',
      carrierId: 'carrier-1',
      firstName: 'Alex',
      lastName: 'Driver',
      isAvailable: true,
    });
    mockVehicleAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'vehicle-1',
      carrierId: 'carrier-1',
      unitNumber: 'TRK-1',
      driverId: 'driver-1',
      isActive: true,
    });
    mockLoadRepository.update.mockResolvedValue(
      buildLoad({ carrierId: 'carrier-1', driverId: 'driver-1', vehicleId: 'vehicle-1' }),
    );
  });

  it('rejects assignment when the carrier is not dispatchable by the org', async () => {
    mockCarrierAssignmentQuery.findDispatchableById.mockResolvedValue(null);

    await expect(
      loadService.assignLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'admin',
        input: { carrierId: 'carrier-2' },
      }),
    ).rejects.toBeInstanceOf(AssignmentValidationError);
  });

  it('rejects cross-carrier driver and vehicle combinations', async () => {
    mockDriverAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'driver-9',
      carrierId: 'carrier-9',
      firstName: 'Chris',
      lastName: 'Mismatch',
      isAvailable: true,
    });

    await expect(
      loadService.assignLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'dispatcher',
        input: { carrierId: 'carrier-1', driverId: 'driver-9' },
      }),
    ).rejects.toBeInstanceOf(AssignmentValidationError);
  });

  it('rejects an unavailable driver', async () => {
    mockDriverAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'driver-1',
      carrierId: 'carrier-1',
      firstName: 'Alex',
      lastName: 'Driver',
      isAvailable: false,
    });

    await expect(
      loadService.assignLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'dispatcher',
        input: { carrierId: 'carrier-1', driverId: 'driver-1' },
      }),
    ).rejects.toBeInstanceOf(AssignmentValidationError);
  });

  it('returns a warning when vehicle is already tied to an active load', async () => {
    mockLoadRepository.findBlockingLoadIdsByVehicle.mockResolvedValue(['load-77']);

    const result = await loadService.assignLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'dispatcher',
      input: { carrierId: 'carrier-1', vehicleId: 'vehicle-1' },
    });

    const warning = result.warnings.find(
      (w: { code: string }) => w.code === 'VEHICLE_ACTIVE_LOADS',
    );
    expect(warning).toBeDefined();
  });

  it('rejects onboarding-blocked external carriers', async () => {
    mockCarrierAssignmentQuery.findDispatchableById.mockResolvedValue({
      id: 'carrier-2',
      name: 'External Carrier',
      type: 'EXTERNAL_CARRIER',
      dispatchAgreementOnFile: false,
      insuranceCertOnFile: true,
      insuranceExpiry: null,
      w9OnFile: true,
    });

    await expect(
      loadService.assignLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'dispatcher',
        input: { carrierId: 'carrier-2' },
      }),
    ).rejects.toBeInstanceOf(AssignmentValidationError);
  });

  it('returns warnings for a home-pairing mismatch but still updates the load', async () => {
    mockVehicleAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'vehicle-1',
      carrierId: 'carrier-1',
      unitNumber: 'TRK-1',
      driverId: 'driver-2',
      isActive: true,
    });

    const result = await loadService.assignLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'dispatcher',
      input: { carrierId: 'carrier-1', driverId: 'driver-1', vehicleId: 'vehicle-1' },
    });

    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'VEHICLE_HOME_DRIVER_MISMATCH' })]),
    );
    expect(mockLoadRepository.update).toHaveBeenCalledWith('load-1', {
      carrierId: 'carrier-1',
      driverId: 'driver-1',
      vehicleId: 'vehicle-1',
    });
  });

  it('reuses assignment validation on generic load updates', async () => {
    mockVehicleAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'vehicle-3',
      carrierId: 'carrier-3',
      unitNumber: 'TRK-3',
      driverId: null,
      isActive: true,
    });

    await expect(
      loadService.updateLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'dispatcher',
        input: { vehicleId: 'vehicle-3' },
      }),
    ).rejects.toBeInstanceOf(AssignmentValidationError);
  });
});
