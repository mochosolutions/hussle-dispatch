import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import Decimal from 'decimal.js';
import { AssignmentValidationError, ConflictError, ValidationError } from '../../../shared/errors';
import { createLoadService } from '../loadService';
import type {
  CarrierAssignmentQueryPort,
  DriverAssignmentQueryPort,
  LoadRepoPort,
  LoadWithRelations,
  OrgSettingsQueryPort,
  VehicleAssignmentQueryPort,
} from '../../types/loadTypes';
import type { Logger } from '../../../shared/utils/logger';
import type { DerivedComplianceDeps } from '../../../carriers/services/derivedCompliance';
import type { DocumentRepoPort } from '../../../documents/types/documentTypes';
import type { AgreementRepoPort } from '../../../agreements/types/agreementRepoPort';

// Default stub: insurance + agreement both on-file so the onboarding gate passes.
// Tests can override `mockResolvedValueOnce([])` to simulate missing docs/agreements.
const buildDerivedComplianceDeps = (): DerivedComplianceDeps => {
  const documentRepo: jest.Mocked<Pick<DocumentRepoPort, 'findManyForCompliance'>> = {
    findManyForCompliance: jest.fn(),
  };
  const agreementRepo: jest.Mocked<Pick<AgreementRepoPort, 'findManySigned'>> = {
    findManySigned: jest.fn(),
  };
  // Default: every requested carrier has a doc + agreement on file.
  documentRepo.findManyForCompliance.mockImplementation(async (carrierIds, _types) =>
    carrierIds.map((entityId) => ({
      id: `doc-${entityId}`,
      entityId,
      type: 'INSURANCE_CERT',
      createdAt: new Date(),
      expiresAt: null,
    }) as Awaited<ReturnType<DocumentRepoPort['findManyForCompliance']>>[number]),
  );
  agreementRepo.findManySigned.mockImplementation(async (carrierIds) =>
    carrierIds.map((carrierId) => ({
      id: `agreement-${carrierId}`,
      carrierId,
      signedAt: new Date(),
      status: 'SIGNED',
    }) as Awaited<ReturnType<AgreementRepoPort['findManySigned']>>[number]),
  );
  return { documentRepo, agreementRepo };
};

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
    // US-14: persisted financial output cache columns removed — derived on read.
    dispatchFeeType: null,
    dispatchFeeAmount: null,
    estimatedHours: null,
    dispatcherUserId: null,
    version: 0,
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
    onboardingOverride: false,
    onboardingOverrideReason: null,
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
    findRateSnapshot: jest.fn().mockResolvedValue(null),
  };

  const mockDriverAssignmentQuery: jest.Mocked<DriverAssignmentQueryPort> = {
    findAssignableById: jest.fn(),
    findRateSnapshot: jest.fn().mockResolvedValue(null),
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
    derivedComplianceDeps: buildDerivedComplianceDeps(),
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
      tinOnFile: true,
    });
    mockDriverAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'driver-1',
      carrierId: 'carrier-1',
      firstName: 'Alex',
      lastName: 'Driver',
      isAvailable: true,
      licenseExpiry: null,
    });
    mockVehicleAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'vehicle-1',
      carrierId: 'carrier-1',
      unitNumber: 'TRK-1',
      driverId: 'driver-1',
      isActive: true,
      type: 'DRY_VAN',
    });
    mockLoadRepository.create.mockResolvedValue(
      buildLoad({ carrierId: 'carrier-1', driverId: 'driver-1', vehicleId: 'vehicle-1' }),
    );
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
        userId: 'user-1',
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
      licenseExpiry: null,
    });

    await expect(
      loadService.assignLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'dispatcher',
        userId: 'user-1',
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
      licenseExpiry: null,
    });

    await expect(
      loadService.assignLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'dispatcher',
        userId: 'user-1',
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
      userId: 'user-1',
      input: { carrierId: 'carrier-1', vehicleId: 'vehicle-1' },
    });

    const warning = result.warnings.find(
      (w: { code: string }) => w.code === 'VEHICLE_ACTIVE_LOADS',
    );
    expect(warning).toBeDefined();
  });

  it('rejects onboarding-blocked external carriers', async () => {
    // Drive onboarding gate failure via the derived-compliance stub (no signed
    // agreement) rather than the legacy port fields, which no longer exist.
    mockCarrierAssignmentQuery.findDispatchableById.mockResolvedValue({
      id: 'carrier-2',
      name: 'External Carrier',
      type: 'EXTERNAL_CARRIER',
      tinOnFile: true,
    });
    const noAgreementDeps = buildDerivedComplianceDeps();
    (noAgreementDeps.agreementRepo.findManySigned as jest.Mock).mockResolvedValue([]);
    // Override the service used by this single test with one that sees no
    // agreements on file (forces onboarding gate to block).
    const blockedService = createLoadService({
      loadRepository: mockLoadRepository,
      orgSettingsQuery: mockOrgSettingsQuery,
      carrierAssignmentQuery: mockCarrierAssignmentQuery,
      driverAssignmentQuery: mockDriverAssignmentQuery,
      vehicleAssignmentQuery: mockVehicleAssignmentQuery,
      derivedComplianceDeps: noAgreementDeps,
    });

    await expect(
      blockedService.assignLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'dispatcher',
        userId: 'user-1',
        input: { carrierId: 'carrier-2' },
      }),
    ).rejects.toBeInstanceOf(AssignmentValidationError);
  });

  // -------------------------------------------------------------------------
  // Tier-based dispatch requirements: EQUIPMENT_MISMATCH (explicitAdmin tier)
  // -------------------------------------------------------------------------

  const buildAuditMock = () => ({
    create: jest.fn<() => Promise<unknown>>().mockResolvedValue({}),
    findByEntity: jest.fn(),
    findByUser: jest.fn(),
    findRecent: jest.fn(),
  });

  it('blocks a dispatcher when the vehicle equipment cannot haul the load', async () => {
    // DRY_VAN load + BOX_TRUCK vehicle = explicitAdmin mismatch, no override available.
    mockLoadRepository.findById.mockResolvedValue(
      buildLoad({ carrierId: 'carrier-1', driverId: null, vehicleId: null, equipmentType: 'DRY_VAN' }),
    );
    mockVehicleAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'vehicle-1',
      carrierId: 'carrier-1',
      unitNumber: 'TRK-1',
      driverId: null,
      isActive: true,
      type: 'BOX_TRUCK',
    });

    await expect(
      loadService.assignLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'dispatcher',
        userId: 'user-1',
        input: { carrierId: 'carrier-1', vehicleId: 'vehicle-1' },
      }),
    ).rejects.toBeInstanceOf(AssignmentValidationError);
    expect(mockLoadRepository.update).not.toHaveBeenCalled();
  });

  it('blocks an admin equipment mismatch when overrideDispatch is not set', async () => {
    mockLoadRepository.findById.mockResolvedValue(
      buildLoad({ carrierId: 'carrier-1', driverId: null, vehicleId: null, equipmentType: 'DRY_VAN' }),
    );
    mockVehicleAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'vehicle-1',
      carrierId: 'carrier-1',
      unitNumber: 'TRK-1',
      driverId: null,
      isActive: true,
      type: 'BOX_TRUCK',
    });

    await expect(
      loadService.assignLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'admin',
        userId: 'admin-1',
        input: { carrierId: 'carrier-1', vehicleId: 'vehicle-1' },
      }),
    ).rejects.toBeInstanceOf(AssignmentValidationError);
    expect(mockLoadRepository.update).not.toHaveBeenCalled();
  });

  it('downgrades an equipment mismatch to a warning for an admin with overrideDispatch and audits it', async () => {
    mockLoadRepository.findById.mockResolvedValue(
      buildLoad({ carrierId: 'carrier-1', driverId: null, vehicleId: null, equipmentType: 'DRY_VAN' }),
    );
    mockVehicleAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'vehicle-1',
      carrierId: 'carrier-1',
      unitNumber: 'TRK-1',
      driverId: null,
      isActive: true,
      type: 'BOX_TRUCK',
    });
    const auditRepo = buildAuditMock();
    const overrideService = createLoadService({
      loadRepository: mockLoadRepository,
      orgSettingsQuery: mockOrgSettingsQuery,
      carrierAssignmentQuery: mockCarrierAssignmentQuery,
      driverAssignmentQuery: mockDriverAssignmentQuery,
      vehicleAssignmentQuery: mockVehicleAssignmentQuery,
      derivedComplianceDeps: buildDerivedComplianceDeps(),
      auditLogFactory: () => auditRepo,
    });

    const result = await overrideService.assignLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'admin',
      userId: 'admin-1',
      overrideDispatch: true,
      overrideReason: 'Customer confirmed equipment swap',
      input: { carrierId: 'carrier-1', vehicleId: 'vehicle-1' },
    });

    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'EQUIPMENT_MISMATCH' })]),
    );
    expect(mockLoadRepository.update).toHaveBeenCalled();
    expect(auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DISPATCH_OVERRIDE',
        entityType: 'LOAD',
        entityId: 'load-1',
        userId: 'admin-1',
        metadata: expect.objectContaining({
          overriddenCodes: expect.arrayContaining(['EQUIPMENT_MISMATCH']),
          reason: 'Customer confirmed equipment swap',
        }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // Tier-based dispatch requirements: DRIVER_LICENSE_EXPIRED (explicitAdmin)
  // -------------------------------------------------------------------------

  it('blocks a dispatcher when the assigned driver has an expired license', async () => {
    mockDriverAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'driver-1',
      carrierId: 'carrier-1',
      firstName: 'Alex',
      lastName: 'Driver',
      isAvailable: true,
      licenseExpiry: new Date('2020-01-01T00:00:00.000Z'),
    });

    await expect(
      loadService.assignLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'dispatcher',
        userId: 'user-1',
        input: { carrierId: 'carrier-1', driverId: 'driver-1' },
      }),
    ).rejects.toBeInstanceOf(AssignmentValidationError);
    expect(mockLoadRepository.update).not.toHaveBeenCalled();
  });

  it('downgrades an expired-license block to a warning for an admin with overrideDispatch and audits it', async () => {
    mockDriverAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'driver-1',
      carrierId: 'carrier-1',
      firstName: 'Alex',
      lastName: 'Driver',
      isAvailable: true,
      licenseExpiry: new Date('2020-01-01T00:00:00.000Z'),
    });
    const auditRepo = buildAuditMock();
    const overrideService = createLoadService({
      loadRepository: mockLoadRepository,
      orgSettingsQuery: mockOrgSettingsQuery,
      carrierAssignmentQuery: mockCarrierAssignmentQuery,
      driverAssignmentQuery: mockDriverAssignmentQuery,
      vehicleAssignmentQuery: mockVehicleAssignmentQuery,
      derivedComplianceDeps: buildDerivedComplianceDeps(),
      auditLogFactory: () => auditRepo,
    });

    const result = await overrideService.assignLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'admin',
      userId: 'admin-1',
      overrideDispatch: true,
      input: { carrierId: 'carrier-1', driverId: 'driver-1' },
    });

    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'DRIVER_LICENSE_EXPIRED' })]),
    );
    expect(mockLoadRepository.update).toHaveBeenCalled();
    expect(auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DISPATCH_OVERRIDE',
        metadata: expect.objectContaining({
          overriddenCodes: expect.arrayContaining(['DRIVER_LICENSE_EXPIRED']),
        }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // Tier-based dispatch requirements: CARRIER_ONBOARDING_INCOMPLETE (silentAdmin)
  // -------------------------------------------------------------------------

  const buildOnboardingBlockedService = () => {
    // Existing load already on carrier-2 with no driver/vehicle, so the only
    // possible blocker is the onboarding gate (no carrier/driver mismatch).
    mockLoadRepository.findById.mockResolvedValue(
      buildLoad({ carrierId: 'carrier-2', driverId: null, vehicleId: null }),
    );
    mockCarrierAssignmentQuery.findDispatchableById.mockResolvedValue({
      id: 'carrier-2',
      name: 'External Carrier',
      type: 'EXTERNAL_CARRIER',
      tinOnFile: true,
    });
    const noAgreementDeps = buildDerivedComplianceDeps();
    (noAgreementDeps.agreementRepo.findManySigned as jest.Mock).mockResolvedValue([]);
    return createLoadService({
      loadRepository: mockLoadRepository,
      orgSettingsQuery: mockOrgSettingsQuery,
      carrierAssignmentQuery: mockCarrierAssignmentQuery,
      driverAssignmentQuery: mockDriverAssignmentQuery,
      vehicleAssignmentQuery: mockVehicleAssignmentQuery,
      derivedComplianceDeps: noAgreementDeps,
    });
  };

  it('blocks a non-admin when the carrier is missing a signed agreement (silent tier)', async () => {
    const service = buildOnboardingBlockedService();

    await expect(
      service.assignLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'dispatcher',
        userId: 'user-1',
        input: { carrierId: 'carrier-2' },
      }),
    ).rejects.toBeInstanceOf(AssignmentValidationError);
    expect(mockLoadRepository.update).not.toHaveBeenCalled();
  });

  it('lets an admin assign a missing-docs carrier with no flag (silent tier auto-allow)', async () => {
    const service = buildOnboardingBlockedService();

    const result = await service.assignLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'admin',
      userId: 'admin-1',
      input: { carrierId: 'carrier-2' },
    });

    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'CARRIER_ONBOARDING_INCOMPLETE' }),
      ]),
    );
    expect(mockLoadRepository.update).toHaveBeenCalled();
  });

  it('returns warnings for a home-pairing mismatch but still updates the load', async () => {
    mockVehicleAssignmentQuery.findAssignableById.mockResolvedValue({
      id: 'vehicle-1',
      carrierId: 'carrier-1',
      unitNumber: 'TRK-1',
      driverId: 'driver-2',
      isActive: true,
      type: 'DRY_VAN',
    });

    const result = await loadService.assignLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'dispatcher',
      userId: 'user-1',
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
      type: 'DRY_VAN',
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

describe('updateLoad financial field locking', () => {
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
    dispatchFeeType: 'PERCENTAGE' as const,
    dispatchFeePercent: new Decimal('10.0000'),
    dispatchFeeAmount: new Decimal('0'),
    partnerSplitPercent: new Decimal('50.0000'),
    feeIncludesAccessorials: false,
    payFromNet: false,
    includeExpensesOnSettlement: false,
    ownerOpPayPercent: null,
    tin: '12-3456789',
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
    lat: null,
    lng: null,
    legalName: null,
    dbaName: null,
    taxClassification: null,
    tinType: null,
    signatoryName: null,
    signatoryTitle: null,
    homeBaseCity: null,
    homeBaseState: null,
    preferredLanes: null,
    weeklySchedule: null,
    freightPreferences: null,
    maxDaysOut: null,
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
    findRateSnapshot: jest.fn().mockResolvedValue(null),
  };

  const mockDriverAssignmentQuery: jest.Mocked<DriverAssignmentQueryPort> = {
    findAssignableById: jest.fn(),
    findRateSnapshot: jest.fn().mockResolvedValue(null),
  };

  const mockVehicleAssignmentQuery: jest.Mocked<VehicleAssignmentQueryPort> = {
    findAssignableById: jest.fn(),
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
    logger: mockLogger,
    derivedComplianceDeps: buildDerivedComplianceDeps(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrgSettingsQuery.getProhibitedCommodities.mockResolvedValue([]);
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

  it('rejects financial field change when an approved settlement references the load', async () => {
    mockLoadRepository.findById.mockResolvedValue(
      buildLoad({
        customerRate: new Decimal('2800'),
        carrierId: 'carrier-1',
        carrier: companyCarrier,
        loadedMiles: 500,
        status: 'BOOKED',
      }),
    );

    const settlementFreezeQuery = {
      hasNonDraftSettlementForLoad: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    };

    const scopedService = createLoadService({
      loadRepository: mockLoadRepository,
      orgSettingsQuery: mockOrgSettingsQuery,
      carrierAssignmentQuery: mockCarrierAssignmentQuery,
      driverAssignmentQuery: mockDriverAssignmentQuery,
      vehicleAssignmentQuery: mockVehicleAssignmentQuery,
      settlementFreezeQuery,
      derivedComplianceDeps: buildDerivedComplianceDeps(),
    });

    await expect(
      scopedService.updateLoad({
        id: 'load-1',
        organizationId: 'org-1',
        role: 'admin',
        input: { customerRate: 3000 },
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(settlementFreezeQuery.hasNonDraftSettlementForLoad).toHaveBeenCalledWith(
      'load-1',
      'org-1',
    );
  });
});
