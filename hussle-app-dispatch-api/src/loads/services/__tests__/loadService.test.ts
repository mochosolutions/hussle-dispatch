import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import Decimal from 'decimal.js';
import { AssignmentValidationError, ValidationError } from '../../../shared/errors';
import { createLoadService } from '../loadService';
import type {
  CarrierAssignmentQueryPort,
  DriverAssignmentQueryPort,
  LoadRepoPort,
  LoadWithRelations,
  OrgSettingsQueryPort,
  VehicleAssignmentQueryPort,
} from '../../types/loadTypes';
import type { LoadStatusRepoPort } from '../../types/loadStatusTypes';
import type { Logger } from '../../../shared/utils/logger';

jest.mock('@/shared/sequenceGenerator', () => ({
  generateSequenceNumber: jest.fn<() => Promise<string>>().mockResolvedValue('L-0001'),
}));

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
    isTeamDriver: false,
    loadedMiles: null,
    deadheadMiles: null,
    totalMiles: null,
    customerRate: null,
    carrierRate: null,
    dispatchFee: null,
    partnerSplit: null,
    ratePerMile: null,
    ratePerTotalMile: null,
    carrierPayout: null,
    companyMargin: null,
    driverPay: null,
    estimatedHours: null,
    estimatedCost: null,
    dispatcherComm: null,
    dispatcherUserId: null,
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
    findByIdUnscoped: jest.fn(),
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

describe('updateLoad financial recalculation', () => {
  const companyCarrier = {
    id: 'carrier-1',
    managedByOrgId: 'org-1',
    carrierOrgId: null,
    name: 'Fleet Carrier',
    type: 'COMPANY_ASSET' as const,
    mcNumber: null,
    dotNumber: null,
    ein: null,
    phone: null,
    email: null,
    address: null,
    city: null,
    state: null,
    zip: null,
    primaryContactId: null,
    dispatchFeePercent: new Decimal('10.0000'),
    partnerSplitPercent: new Decimal('50.0000'),
    feeIncludesAccessorials: false,
    feeType: 'PER_LOAD_PERCENT' as const,
    payFromNet: false,
    includeExpensesOnSettlement: false,
    ownerOpPayPercent: null,
    dispatchAgreementOnFile: true,
    dispatchAgreementSignedAt: null,
    insuranceCertOnFile: true,
    insuranceExpiry: null,
    w9OnFile: true,
    carrierPacketOnFile: false,
    onboardingStatus: 'APPROVED' as const,
    minimumRatePerMile: null,
    inviteSentAt: null,
    entryMethod: 'MANUAL',
    dispatchAgreementConsentIp: null,
    dispatchAgreementConsentUserAgent: null,
    costProfileVersion: 0,
    costProfileSource: null,
    howFoundUs: null,
    fuelCardProviders: [],
    authorityStatus: 'active',
    billingMethod: 'DIRECT' as const,
    factoringCompanyName: null,
    factoringCompanyEmail: null,
    factoringSubmissionMethod: null,
    factoringAdvanceRate: null,
    factoringFeePercent: null,
    factoringNoa: null,
    outboundEmailMode: 'MANUAL' as const,
    replyToEmail: null,
    description: null,
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockLoadRepository: jest.Mocked<LoadRepoPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdUnscoped: jest.fn(),
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

  const mockLoadStatusRepo: jest.Mocked<
    Pick<LoadStatusRepoPort, 'sumAccessorialCharges' | 'updateFinancials'>
  > = {
    sumAccessorialCharges: jest.fn<() => Promise<string>>(),
    updateFinancials: jest.fn<() => Promise<void>>(),
  };

  const mockLogger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const loadService = createLoadService({
    loadRepository: mockLoadRepository,
    orgSettingsQuery: mockOrgSettingsQuery,
    carrierAssignmentQuery: mockCarrierAssignmentQuery,
    driverAssignmentQuery: mockDriverAssignmentQuery,
    vehicleAssignmentQuery: mockVehicleAssignmentQuery,
    loadStatusRepo: mockLoadStatusRepo,
    logger: mockLogger,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrgSettingsQuery.getProhibitedCommodities.mockResolvedValue([]);
  });

  it('recalculates financials when customerRate changes on BOOKED load', async () => {
    const existing = buildLoad({
      customerRate: new Decimal('2800'),
      carrierId: 'carrier-1',
      carrier: companyCarrier,
      loadedMiles: 500,
      status: 'BOOKED',
    });
    const updated = buildLoad({
      ...existing,
      customerRate: new Decimal('3000'),
    });

    mockLoadRepository.findById.mockResolvedValue(existing);
    mockLoadRepository.update.mockResolvedValue(updated);
    mockLoadStatusRepo.sumAccessorialCharges.mockResolvedValue('0.00');
    mockLoadStatusRepo.updateFinancials.mockResolvedValue(undefined);

    // After recalculation, findById is called again to re-fetch
    mockLoadRepository.findById.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

    await loadService.updateLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'admin',
      input: { customerRate: 3000 },
    });

    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalled();
  });

  it('recalculates financials when loadedMiles changes on BOOKED load', async () => {
    const existing = buildLoad({
      customerRate: new Decimal('2800'),
      carrierId: 'carrier-1',
      carrier: companyCarrier,
      loadedMiles: 500,
      status: 'BOOKED',
    });
    const updated = buildLoad({
      ...existing,
      loadedMiles: 600,
    });

    mockLoadRepository.findById.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);
    mockLoadRepository.update.mockResolvedValue(updated);
    mockLoadStatusRepo.sumAccessorialCharges.mockResolvedValue('0.00');
    mockLoadStatusRepo.updateFinancials.mockResolvedValue(undefined);

    await loadService.updateLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'admin',
      input: { loadedMiles: 600 },
    });

    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalled();
  });

  it('does not recalculate when non-financial field changes', async () => {
    const existing = buildLoad({
      customerRate: new Decimal('2800'),
      carrierId: 'carrier-1',
      carrier: companyCarrier,
      loadedMiles: 500,
      status: 'BOOKED',
    });
    const updated = buildLoad({
      ...existing,
      dispatcherNotes: 'updated notes',
    });

    mockLoadRepository.findById.mockResolvedValue(existing);
    mockLoadRepository.update.mockResolvedValue(updated);

    await loadService.updateLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'admin',
      input: { dispatcherNotes: 'updated notes' },
    });

    expect(mockLoadStatusRepo.updateFinancials).not.toHaveBeenCalled();
  });

  it('does not recalculate when carrier is null', async () => {
    const existing = buildLoad({
      customerRate: new Decimal('2800'),
      carrierId: null,
      carrier: null,
      loadedMiles: 500,
      status: 'BOOKED',
    });
    const updated = buildLoad({
      ...existing,
      customerRate: new Decimal('3000'),
    });

    mockLoadRepository.findById.mockResolvedValue(existing);
    mockLoadRepository.update.mockResolvedValue(updated);

    await loadService.updateLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'admin',
      input: { customerRate: 3000 },
    });

    expect(mockLoadStatusRepo.updateFinancials).not.toHaveBeenCalled();
  });

  it('recalculates financials when carrierId changes on BOOKED load', async () => {
    const existing = buildLoad({
      customerRate: new Decimal('2800'),
      carrierId: 'carrier-1',
      carrier: companyCarrier,
      driverId: null,
      driver: null,
      vehicleId: null,
      vehicle: null,
      loadedMiles: 500,
      status: 'BOOKED',
    });
    const updated = buildLoad({
      ...existing,
      carrierId: 'carrier-2',
      carrier: { ...companyCarrier, id: 'carrier-2' },
    });

    mockLoadRepository.findById.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);
    mockLoadRepository.update.mockResolvedValue(updated);
    mockCarrierAssignmentQuery.findDispatchableById.mockResolvedValue({
      id: 'carrier-2',
      name: 'New Carrier',
      type: 'COMPANY_ASSET',
      dispatchAgreementOnFile: true,
      insuranceCertOnFile: true,
      insuranceExpiry: null,
      w9OnFile: true,
    });
    mockLoadStatusRepo.sumAccessorialCharges.mockResolvedValue('0.00');
    mockLoadStatusRepo.updateFinancials.mockResolvedValue(undefined);

    await loadService.updateLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'admin',
      input: { carrierId: 'carrier-2' },
    });

    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalled();
  });

  it('re-fetches load after financial calculation on createLoad', async () => {
    const staleLoad = buildLoad({
      carrierId: 'carrier-1',
      carrier: companyCarrier,
      customerRate: new Decimal('2800'),
      loadedMiles: 500,
      companyMargin: null,
      stops: [
        {
          id: 'stop-1',
          loadId: 'load-1',
          type: 'PICKUP',
          sequence: 0,
          contactId: null,
          placeId: null,
          facilityName: null,
          address: null,
          city: 'Dallas',
          state: 'TX',
          zip: null,
          schedulingType: 'FCFS',
          appointmentStart: null,
          appointmentEnd: null,
          targetDate: null,
          notificationHours: null,
          notifiedAt: null,
          appointmentNumber: null,
          arrivalTime: null,
          departureTime: null,
          contactName: null,
          contactPhone: null,
          commodity: 'Steel',
          weight: 40000,
          pieceCount: 1,
          isHazmat: false,
          isTarp: false,
          isTempControlled: false,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'stop-2',
          loadId: 'load-1',
          type: 'DELIVERY',
          sequence: 1,
          contactId: null,
          placeId: null,
          facilityName: null,
          address: null,
          city: 'Houston',
          state: 'TX',
          zip: null,
          schedulingType: 'FCFS',
          appointmentStart: null,
          appointmentEnd: null,
          targetDate: null,
          notificationHours: null,
          notifiedAt: null,
          appointmentNumber: null,
          arrivalTime: null,
          departureTime: null,
          contactName: null,
          contactPhone: null,
          commodity: null,
          weight: null,
          pieceCount: null,
          isHazmat: false,
          isTarp: false,
          isTempControlled: false,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const freshLoad = buildLoad({
      ...staleLoad,
      companyMargin: new Decimal('500'),
      dispatchFee: new Decimal('280'),
    });

    mockLoadRepository.create.mockResolvedValue(staleLoad);
    mockLoadRepository.findById.mockResolvedValue(freshLoad);
    mockLoadStatusRepo.sumAccessorialCharges.mockResolvedValue('0.00');
    mockLoadStatusRepo.updateFinancials.mockResolvedValue(undefined);

    const result = await loadService.createLoad({
      organizationId: 'org-1',
      role: 'admin',
      input: {
        carrierId: 'carrier-1',
        customerRate: 2800,
        loadedMiles: 500,
        stops: [
          { type: 'PICKUP', sequence: 0, city: 'Dallas', state: 'TX', commodity: 'Steel', weight: 40000, pieceCount: 1 },
          { type: 'DELIVERY', sequence: 1, city: 'Houston', state: 'TX' },
        ],
      },
    });

    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalled();
    expect(mockLoadRepository.findById).toHaveBeenCalledWith('load-1', 'org-1');
    expect(result.companyMargin).toEqual(new Decimal('500'));
  });

  it('rejects financial field change on DISPATCHED load', async () => {
    const existing = buildLoad({
      customerRate: new Decimal('2800'),
      carrierId: 'carrier-1',
      carrier: companyCarrier,
      loadedMiles: 500,
      status: 'DISPATCHED',
    });

    mockLoadRepository.findById.mockResolvedValue(existing);

    await expect(
      loadService.updateLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'admin',
        input: { customerRate: 3000 },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
