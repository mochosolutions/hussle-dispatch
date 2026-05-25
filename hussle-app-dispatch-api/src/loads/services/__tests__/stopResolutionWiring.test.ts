import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createLoadService, type ResolveStopToPlace } from '../loadService';
import { createStopService } from '../stopService';
import type {
  CarrierAssignmentQueryPort,
  DriverAssignmentQueryPort,
  LoadRepoPort,
  LoadWithRelations,
  OrgSettingsQueryPort,
  StopInput,
  VehicleAssignmentQueryPort,
} from '../../types/loadTypes';
import type { StopRepoPort } from '../../types/stopTypes';
import type { DerivedComplianceDeps } from '../../../carriers/services/derivedCompliance';
import type { DocumentRepoPort } from '../../../documents/types/documentTypes';
import type { AgreementRepoPort } from '../../../agreements/types/agreementRepoPort';

jest.mock('@/shared/sequenceGenerator', () => ({
  generateSequenceNumber: jest.fn<() => Promise<string>>().mockResolvedValue('L-0001'),
}));

// Stop-resolution tests don't exercise the onboarding gate, but createLoadService
// now requires `derivedComplianceDeps`. Provide a no-op stub.
const stubDerivedComplianceDeps = (): DerivedComplianceDeps => {
  const documentRepo: jest.Mocked<Pick<DocumentRepoPort, 'findManyForCompliance'>> = {
    findManyForCompliance: jest.fn<DocumentRepoPort['findManyForCompliance']>(
      async () => [],
    ),
  };
  const agreementRepo: jest.Mocked<Pick<AgreementRepoPort, 'findManySigned'>> = {
    findManySigned: jest.fn<AgreementRepoPort['findManySigned']>(async () => []),
  };
  return { documentRepo, agreementRepo };
};

const buildLoad = (overrides?: Partial<LoadWithRelations>): LoadWithRelations =>
  ({
    id: 'load-1',
    organizationId: 'org-1',
    loadNumber: 'L-0001',
    carrierId: null,
    driverId: null,
    vehicleId: null,
    contactId: null,
    customerId: null,
    dispatcherUserId: null,
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
    version: 0,
    status: 'BOOKED',
    invoiceReadiness: 'NOT_READY',
    rateConReceivedAt: null,
    bolUnsignedAt: null,
    bolSignedAt: null,
    dispatcherNotes: null,
    driverInstructions: null,
    scrapedLoadId: null,
    plannedNextLoadRef: null,
    createdByUserId: null,
    updatedByUserId: null,
    onboardingOverride: false,
    onboardingOverrideReason: null,
    dispatchFeeOverrideType: null,
    dispatchFeeOverrideAmount: null,
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
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
    ...overrides,
  }) as LoadWithRelations;

const mockLoadRepository = (): jest.Mocked<LoadRepoPort> => ({
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
});

const baseStops = (): StopInput[] => [
  {
    type: 'PICKUP',
    sequence: 0,
    appointmentStart: new Date('2026-05-01T10:00:00Z'),
    facilityName: 'Acme Pickup',
    address: '100 Main',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
  },
  {
    type: 'DELIVERY',
    sequence: 1,
    appointmentStart: new Date('2026-05-02T10:00:00Z'),
    facilityName: 'Acme Delivery',
    address: '200 Elm',
    city: 'Houston',
    state: 'TX',
    zip: '77002',
  },
];

const orgSettings: jest.Mocked<OrgSettingsQueryPort> = {
  getProhibitedCommodities: jest.fn<() => Promise<string[]>>().mockResolvedValue([]),
};

const carrierQuery: jest.Mocked<CarrierAssignmentQueryPort> = {
  findDispatchableById: jest.fn(),
};

const driverQuery: jest.Mocked<DriverAssignmentQueryPort> = {
  findAssignableById: jest.fn(),
};

const vehicleQuery: jest.Mocked<VehicleAssignmentQueryPort> = {
  findAssignableById: jest.fn(),
};

describe('createLoad — resolveStopToPlace wiring', () => {
  let loadRepo: jest.Mocked<LoadRepoPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    orgSettings.getProhibitedCommodities.mockResolvedValue([]);
    loadRepo = mockLoadRepository();
    loadRepo.create.mockResolvedValue(buildLoad());
  });

  it('persists placeId and RESOLVED on each stop and returns empty warnings on success', async () => {
    const resolveStopToPlace = jest.fn<ResolveStopToPlace>().mockImplementation(
      async (stop) =>
        Promise.resolve({
          placeId: `place-${stop.sequence}`,
          resolutionStatus: 'RESOLVED',
          warning: null,
          facilityNameToWrite: 'Resolved Facility',
        }),
    );

    const service = createLoadService({
      loadRepository: loadRepo,
      orgSettingsQuery: orgSettings,
      carrierAssignmentQuery: carrierQuery,
      driverAssignmentQuery: driverQuery,
      vehicleAssignmentQuery: vehicleQuery,
      derivedComplianceDeps: stubDerivedComplianceDeps(),
      resolveStopToPlace,
    });

    const result = await service.createLoad({
      organizationId: 'org-1',
      role: 'admin',
      input: { stops: baseStops() },
    });

    expect(resolveStopToPlace).toHaveBeenCalledTimes(2);
    expect(result.warnings).toEqual([]);

    const persistedStops = (loadRepo.create.mock.calls[0]?.[2].stops ?? []) as StopInput[];
    expect(persistedStops[0]?.placeId).toBe('place-0');
    expect(persistedStops[0]?.resolutionStatus).toBe('RESOLVED');
    expect(persistedStops[0]?.facilityName).toBe('Resolved Facility');
    expect(persistedStops[1]?.placeId).toBe('place-1');
    expect(persistedStops[1]?.resolutionStatus).toBe('RESOLVED');
  });

  it('collects AMBIGUOUS warning and persists null placeId for the offending stop', async () => {
    const resolveStopToPlace = jest.fn<ResolveStopToPlace>().mockImplementation(
      async (stop) => {
        if (stop.sequence === 0) {
          return Promise.resolve({
            placeId: null,
            resolutionStatus: 'AMBIGUOUS',
            warning: {
              code: 'STOP_AMBIGUOUS_ADDRESS',
              stopSequence: 0,
              message: 'Address is ambiguous.',
            },
          });
        }
        return Promise.resolve({
          placeId: 'place-1',
          resolutionStatus: 'RESOLVED',
          warning: null,
        });
      },
    );

    const service = createLoadService({
      loadRepository: loadRepo,
      orgSettingsQuery: orgSettings,
      carrierAssignmentQuery: carrierQuery,
      driverAssignmentQuery: driverQuery,
      vehicleAssignmentQuery: vehicleQuery,
      derivedComplianceDeps: stubDerivedComplianceDeps(),
      resolveStopToPlace,
    });

    const result = await service.createLoad({
      organizationId: 'org-1',
      role: 'admin',
      input: { stops: baseStops() },
    });

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toEqual({
      code: 'STOP_AMBIGUOUS_ADDRESS',
      stopSequence: 0,
      message: 'Address is ambiguous.',
    });

    const persistedStops = (loadRepo.create.mock.calls[0]?.[2].stops ?? []) as StopInput[];
    expect(persistedStops[0]?.placeId).toBeNull();
    expect(persistedStops[0]?.resolutionStatus).toBe('AMBIGUOUS');
  });

  it('persists UNRESOLVED + GEOCODER_UNAVAILABLE when resolver returns the warning (load is still created)', async () => {
    const resolveStopToPlace = jest.fn<ResolveStopToPlace>().mockResolvedValue({
      placeId: null,
      resolutionStatus: 'UNRESOLVED',
      warning: {
        code: 'GEOCODER_UNAVAILABLE',
        stopSequence: 0,
        message: 'Geocoder unavailable.',
      },
    });

    const service = createLoadService({
      loadRepository: loadRepo,
      orgSettingsQuery: orgSettings,
      carrierAssignmentQuery: carrierQuery,
      driverAssignmentQuery: driverQuery,
      vehicleAssignmentQuery: vehicleQuery,
      derivedComplianceDeps: stubDerivedComplianceDeps(),
      resolveStopToPlace,
    });

    const result = await service.createLoad({
      organizationId: 'org-1',
      role: 'admin',
      input: { stops: baseStops() },
    });

    // Two warnings (one per stop because resolver always returns the warning).
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings.every((w) => w.code === 'GEOCODER_UNAVAILABLE')).toBe(true);
    // Critical: load was still created (no throw, no 5xx).
    expect(loadRepo.create).toHaveBeenCalled();
  });

  it('honors explicit placeId short-circuit (no warning, RESOLVED)', async () => {
    const resolveStopToPlace = jest.fn<ResolveStopToPlace>().mockImplementation(
      async (stop) =>
        Promise.resolve({
          placeId: stop.placeId ?? 'fallback',
          resolutionStatus: 'RESOLVED',
          warning: null,
        }),
    );

    const service = createLoadService({
      loadRepository: loadRepo,
      orgSettingsQuery: orgSettings,
      carrierAssignmentQuery: carrierQuery,
      driverAssignmentQuery: driverQuery,
      vehicleAssignmentQuery: vehicleQuery,
      derivedComplianceDeps: stubDerivedComplianceDeps(),
      resolveStopToPlace,
    });

    const stops = baseStops();
    stops[0] = { ...stops[0]!, placeId: 'explicit-place-id' };

    const result = await service.createLoad({
      organizationId: 'org-1',
      role: 'admin',
      input: { stops },
    });

    expect(result.warnings).toEqual([]);
    const persistedStops = (loadRepo.create.mock.calls[0]?.[2].stops ?? []) as StopInput[];
    expect(persistedStops[0]?.placeId).toBe('explicit-place-id');
    expect(persistedStops[0]?.resolutionStatus).toBe('RESOLVED');
  });

  it('runs resolver sequentially (not in parallel) per stop ordering', async () => {
    const calls: number[] = [];
    const resolveStopToPlace = jest.fn<ResolveStopToPlace>().mockImplementation(
      async (stop) => {
        calls.push(stop.sequence);
        return Promise.resolve({
          placeId: `place-${stop.sequence}`,
          resolutionStatus: 'RESOLVED',
          warning: null,
        });
      },
    );

    const service = createLoadService({
      loadRepository: loadRepo,
      orgSettingsQuery: orgSettings,
      carrierAssignmentQuery: carrierQuery,
      driverAssignmentQuery: driverQuery,
      vehicleAssignmentQuery: vehicleQuery,
      derivedComplianceDeps: stubDerivedComplianceDeps(),
      resolveStopToPlace,
    });

    await service.createLoad({
      organizationId: 'org-1',
      role: 'admin',
      input: { stops: baseStops() },
    });

    expect(calls).toEqual([0, 1]);
  });
});

describe('updateLoad — resolveStopToPlace wiring', () => {
  let loadRepo: jest.Mocked<LoadRepoPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    orgSettings.getProhibitedCommodities.mockResolvedValue([]);
    loadRepo = mockLoadRepository();
    loadRepo.findById.mockResolvedValue(buildLoad());
    loadRepo.update.mockResolvedValue(buildLoad());
  });

  it('re-resolves every inbound stop and includes warnings on response', async () => {
    const resolveStopToPlace = jest.fn<ResolveStopToPlace>().mockImplementation(
      async (stop) =>
        Promise.resolve({
          placeId: `place-${stop.sequence}`,
          resolutionStatus: 'RESOLVED',
          warning: null,
        }),
    );

    const service = createLoadService({
      loadRepository: loadRepo,
      orgSettingsQuery: orgSettings,
      carrierAssignmentQuery: carrierQuery,
      driverAssignmentQuery: driverQuery,
      vehicleAssignmentQuery: vehicleQuery,
      derivedComplianceDeps: stubDerivedComplianceDeps(),
      resolveStopToPlace,
    });

    const result = await service.updateLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'admin',
      input: { stops: baseStops() },
    });

    expect(resolveStopToPlace).toHaveBeenCalledTimes(2);
    expect(result.warnings).toEqual([]);

    const persistedStops = (loadRepo.update.mock.calls[0]?.[1].stops ?? []) as StopInput[];
    expect(persistedStops[0]?.placeId).toBe('place-0');
    expect(persistedStops[0]?.resolutionStatus).toBe('RESOLVED');
  });

  it('does not call resolver when stops are not part of the update', async () => {
    const resolveStopToPlace = jest.fn<ResolveStopToPlace>();

    const service = createLoadService({
      loadRepository: loadRepo,
      orgSettingsQuery: orgSettings,
      carrierAssignmentQuery: carrierQuery,
      driverAssignmentQuery: driverQuery,
      vehicleAssignmentQuery: vehicleQuery,
      derivedComplianceDeps: stubDerivedComplianceDeps(),
      resolveStopToPlace,
    });

    await service.updateLoad({
      id: 'load-1',
      organizationId: 'org-1',
      role: 'admin',
      input: { dispatcherNotes: 'updated' },
    });

    expect(resolveStopToPlace).not.toHaveBeenCalled();
  });
});

describe('createStop / updateStop — resolveStopToPlace wiring', () => {
  const stopRepository: jest.Mocked<StopRepoPort> = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
    findByLoadId: jest.fn(),
    reorder: jest.fn(),
  };

  const loadRepository = {
    findById: jest.fn<() => Promise<unknown>>(),
  };

  const eventBus = {
    publish: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };

  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    loadRepository.findById.mockResolvedValue({ id: 'load-1', organizationId: 'org-1' });
    stopRepository.findByLoadId.mockResolvedValue([]);
    stopRepository.create.mockImplementation(async (input) =>
      Promise.resolve({
        id: 'stop-new',
        loadId: input.loadId,
        sequence: input.sequence ?? 1,
        type: input.type,
        contactId: null,
        placeId: input.placeId ?? null,
        resolutionStatus: input.resolutionStatus ?? 'UNRESOLVED',
        facilityName: input.facilityName ?? null,
        address: null,
        city: null,
        state: null,
        zip: null,
        schedulingType: 'APPOINTMENT',
        appointmentStart: new Date(),
        appointmentEnd: null,
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
        callByTime: null,
        trailerNumber: null,
        yardLocation: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as never),
    );
  });

  it('createStop persists placeId, resolutionStatus and returns warnings on AMBIGUOUS', async () => {
    const resolveStopToPlace = jest.fn<ResolveStopToPlace>().mockResolvedValue({
      placeId: null,
      resolutionStatus: 'AMBIGUOUS',
      warning: {
        code: 'STOP_AMBIGUOUS_ADDRESS',
        stopSequence: 1,
        message: 'Ambiguous',
      },
    });

    const service = createStopService({
      stopRepository,
      loadRepository: loadRepository as never,
      eventBus: eventBus as never,
      logger,
      resolveStopToPlace,
    });

    const result = await service.createStop({
      organizationId: 'org-1',
      loadId: 'load-1',
      type: 'PICKUP',
      appointmentStart: new Date('2026-05-01T10:00:00Z'),
      facilityName: 'Test',
      address: '123 Main',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
    });

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.code).toBe('STOP_AMBIGUOUS_ADDRESS');
    expect(result.stop.resolutionStatus).toBe('AMBIGUOUS');

    const persistCall = stopRepository.create.mock.calls[0]?.[0];
    expect(persistCall?.placeId).toBeNull();
    expect(persistCall?.resolutionStatus).toBe('AMBIGUOUS');
  });

  it('updateStop re-runs resolver and persists the new placeId / resolutionStatus', async () => {
    stopRepository.findById.mockResolvedValue({
      id: 'stop-1',
      loadId: 'load-1',
      sequence: 0,
      type: 'PICKUP',
      placeId: null,
      resolutionStatus: 'UNRESOLVED',
      facilityName: 'Old',
      address: '100 Old',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      contactName: null,
      contactPhone: null,
      notes: null,
      appointmentStart: new Date(),
    } as never);
    stopRepository.update.mockImplementation(async (input) =>
      Promise.resolve({
        id: input.id,
        loadId: 'load-1',
        sequence: 0,
        type: 'PICKUP',
        placeId: input.placeId ?? null,
        resolutionStatus: input.resolutionStatus ?? 'UNRESOLVED',
        facilityName: input.facilityName ?? null,
        appointmentStart: new Date(),
      } as never),
    );

    const resolveStopToPlace = jest.fn<ResolveStopToPlace>().mockResolvedValue({
      placeId: 'place-new',
      resolutionStatus: 'RESOLVED',
      warning: null,
      facilityNameToWrite: 'New Facility',
    });

    const service = createStopService({
      stopRepository,
      loadRepository: loadRepository as never,
      eventBus: eventBus as never,
      logger,
      resolveStopToPlace,
    });

    const result = await service.updateStop({
      id: 'stop-1',
      organizationId: 'org-1',
      address: '200 New',
      appointmentStart: new Date('2026-05-01T10:00:00Z'),
    });

    expect(resolveStopToPlace).toHaveBeenCalledTimes(1);
    expect(result.stop.placeId).toBe('place-new');
    expect(result.stop.resolutionStatus).toBe('RESOLVED');
    expect(result.warnings).toEqual([]);

    const updateCall = stopRepository.update.mock.calls[0]?.[0];
    expect(updateCall?.placeId).toBe('place-new');
    expect(updateCall?.resolutionStatus).toBe('RESOLVED');
    expect(updateCall?.facilityName).toBe('New Facility');
  });

  it('createStop simulates race-condition loser path — returns the existing place id', async () => {
    // The resolver simulates the "second writer" winning by returning the
    // pre-existing place id; the service simply trusts what the resolver
    // returns and persists it.
    const resolveStopToPlace = jest.fn<ResolveStopToPlace>().mockResolvedValue({
      placeId: 'place-shared',
      resolutionStatus: 'RESOLVED',
      warning: null,
    });

    const service = createStopService({
      stopRepository,
      loadRepository: loadRepository as never,
      eventBus: eventBus as never,
      logger,
      resolveStopToPlace,
    });

    const result = await service.createStop({
      organizationId: 'org-1',
      loadId: 'load-1',
      type: 'PICKUP',
      appointmentStart: new Date('2026-05-01T10:00:00Z'),
      facilityName: 'Shared',
      address: '500 Shared',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
    });

    expect(result.stop.placeId).toBe('place-shared');
    expect(result.warnings).toEqual([]);
  });
});
