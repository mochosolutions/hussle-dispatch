import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import Decimal from 'decimal.js';
import type { EventBus } from '../../../shared/messaging/eventBus';
import type { LoadWithRelations } from '../../types/loadTypes';
import { initializeFinancialRecalcSubscriber } from '../financialRecalcSubscriber';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const buildCarrier = () => ({
  id: 'carrier-1',
  managedByOrgId: 'org-1',
  carrierOrgId: null,
  name: 'Test Carrier',
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
  status: 'ACTIVE' as const,
  description: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
});

const buildLoad = (overrides?: Partial<LoadWithRelations>): LoadWithRelations => {
  const base: LoadWithRelations = {
    id: 'load-1',
    organizationId: 'org-1',
    loadNumber: 'L-1001',
    carrierId: 'carrier-1',
    driverId: null,
    vehicleId: null,
    contactId: null,
    externalRefNumber: null,
    equipmentType: null,
    isTeamDriver: false,
    loadedMiles: 500,
    deadheadMiles: null,
    totalMiles: 500,
    customerRate: new Decimal('2500.00'),
    carrierRate: null,
    dispatchFee: null,
    dispatchFeeOverrideType: null,
    dispatchFeeOverrideAmount: null,
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
    version: 0,
    status: 'BOOKED' as const,
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
    carrier: buildCarrier(),
    driver: null,
    vehicle: null,
    contact: null,
    customer: null,
    statusHistory: [],
    checkCalls: [],
    accessorialCharges: [],
    invoiceReadiness: 'NOT_READY' as const,
  };

  return { ...base, ...overrides };
};

// ---------------------------------------------------------------------------
// Typed handler capture helper
// ---------------------------------------------------------------------------

type AccessorialEventData = { loadId: string; organizationId: string; accessorialId: string };
type SubscribeHandler = (data: AccessorialEventData) => Promise<void>;

/**
 * Finds the captured subscribe handler for a given event name after
 * `initializeFinancialRecalcSubscriber` has been called.
 */
const getHandlerForEvent = (
  subscribeMock: { mock: { calls: unknown[][] } },
  eventName: string,
): SubscribeHandler => {
  const matchingCall = subscribeMock.mock.calls.find(
    (call) => call[0] === eventName,
  );
  if (matchingCall === undefined) {
    throw new Error(`No subscribe call found for event: ${eventName}`);
  }
  const handler = matchingCall[2];
  if (typeof handler !== 'function') {
    throw new Error(`Subscribe call for ${eventName} has no handler`);
  }
  return handler as SubscribeHandler;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('initializeFinancialRecalcSubscriber', () => {
  const mockEventBus: jest.Mocked<EventBus> = {
    subscribe: jest.fn<EventBus['subscribe']>().mockResolvedValue(undefined),
    publish: jest.fn<EventBus['publish']>().mockResolvedValue(undefined),
    publishDelayed: jest.fn<EventBus['publishDelayed']>().mockResolvedValue(undefined),
    close: jest.fn<EventBus['close']>().mockResolvedValue(undefined),
  };

  const mockLoadStatusRepo = {
    sumAccessorialCharges: jest.fn<() => Promise<string>>().mockResolvedValue('0'),
    updateFinancials: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };

  const mockVehicleCpmQuery = {
    getRecurringExpenses: jest.fn<() => Promise<{ amount: number; milesPerMonth: number }[]>>().mockResolvedValue([]),
    getActualExpenseSummary: jest.fn<() => Promise<{ totalFixed: number; totalVariable: number; expenseCount: number }>>().mockResolvedValue({ totalFixed: 0, totalVariable: 0, expenseCount: 0 }),
  };

  const mockDispatcherProfileQuery = {
    findByUserId: jest.fn<() => Promise<null>>().mockResolvedValue(null),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockLoadFinder = {
    findByIdUnscoped: jest.fn<() => Promise<LoadWithRelations | null>>(),
  };

  const deps = {
    eventBus: mockEventBus,
    loadFinder: mockLoadFinder,
    loadStatusRepo: mockLoadStatusRepo,
    vehicleCpmQuery: mockVehicleCpmQuery,
    dispatcherProfileQuery: mockDispatcherProfileQuery,
    logger: mockLogger,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventBus.subscribe.mockResolvedValue(undefined);
    mockLoadStatusRepo.sumAccessorialCharges.mockResolvedValue('0');
    mockLoadStatusRepo.updateFinancials.mockResolvedValue(undefined);
    mockVehicleCpmQuery.getRecurringExpenses.mockResolvedValue([]);
    mockDispatcherProfileQuery.findByUserId.mockResolvedValue(null);
  });

  it('subscribes to all three accessorial events', async () => {
    await initializeFinancialRecalcSubscriber(deps);

    expect(mockEventBus.subscribe).toHaveBeenCalledTimes(3);

    const subscribedEvents = mockEventBus.subscribe.mock.calls.map(
      (call) => call[0],
    );
    expect(subscribedEvents).toContain('accessorial.created');
    expect(subscribedEvents).toContain('accessorial.updated');
    expect(subscribedEvents).toContain('accessorial.deleted');
  });

  it('triggers recalculation when accessorial.created is received', async () => {
    mockLoadFinder.findByIdUnscoped.mockResolvedValue(buildLoad());

    await initializeFinancialRecalcSubscriber(deps);

    const handler = getHandlerForEvent(mockEventBus.subscribe, 'accessorial.created');

    await handler({ loadId: 'load-1', organizationId: 'org-1', accessorialId: 'acc-1' });

    expect(mockLoadFinder.findByIdUnscoped).toHaveBeenCalledWith('load-1');
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({
        dispatchFee: expect.any(String),
        carrierPayout: expect.any(String),
        companyMargin: expect.any(String),
      }),
    );
  });

  it('triggers recalculation when accessorial.deleted is received', async () => {
    mockLoadFinder.findByIdUnscoped.mockResolvedValue(buildLoad());

    await initializeFinancialRecalcSubscriber(deps);

    const handler = getHandlerForEvent(mockEventBus.subscribe, 'accessorial.deleted');

    await handler({ loadId: 'load-1', organizationId: 'org-1', accessorialId: 'acc-1' });

    expect(mockLoadFinder.findByIdUnscoped).toHaveBeenCalledWith('load-1');
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalled();
  });

  it('skips recalculation and warns when load has no carrier', async () => {
    mockLoadFinder.findByIdUnscoped.mockResolvedValue(
      buildLoad({ carrier: null, carrierId: null }),
    );

    await initializeFinancialRecalcSubscriber(deps);

    const handler = getHandlerForEvent(mockEventBus.subscribe, 'accessorial.created');

    await handler({ loadId: 'load-1', organizationId: 'org-1', accessorialId: 'acc-1' });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('no carrier'),
      expect.objectContaining({ loadId: 'load-1' }),
    );
    expect(mockLoadStatusRepo.updateFinancials).not.toHaveBeenCalled();
  });

  it('skips recalculation and warns when load has no customerRate', async () => {
    mockLoadFinder.findByIdUnscoped.mockResolvedValue(buildLoad({ customerRate: null }));

    await initializeFinancialRecalcSubscriber(deps);

    const handler = getHandlerForEvent(mockEventBus.subscribe, 'accessorial.created');

    await handler({ loadId: 'load-1', organizationId: 'org-1', accessorialId: 'acc-1' });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('no customer rate'),
      expect.objectContaining({ loadId: 'load-1' }),
    );
    expect(mockLoadStatusRepo.updateFinancials).not.toHaveBeenCalled();
  });

  it('logs a warning when load is not found', async () => {
    mockLoadFinder.findByIdUnscoped.mockResolvedValue(null);

    await initializeFinancialRecalcSubscriber(deps);

    const handler = getHandlerForEvent(mockEventBus.subscribe, 'accessorial.created');

    await handler({ loadId: 'load-missing', organizationId: 'org-1', accessorialId: 'acc-1' });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Load not found for financial recalculation',
      expect.objectContaining({ loadId: 'load-missing' }),
    );
    expect(mockLoadStatusRepo.updateFinancials).not.toHaveBeenCalled();
  });

  it('catches handler errors and logs them', async () => {
    mockLoadFinder.findByIdUnscoped.mockRejectedValue(new Error('DB connection failed'));

    await initializeFinancialRecalcSubscriber(deps);

    const handler = getHandlerForEvent(mockEventBus.subscribe, 'accessorial.created');

    // Should not throw — error is caught inside the handler
    await expect(
      handler({ loadId: 'load-1', organizationId: 'org-1', accessorialId: 'acc-1' }),
    ).resolves.toBeUndefined();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to recalculate financials on accessorial.created',
      expect.objectContaining({
        loadId: 'load-1',
        accessorialId: 'acc-1',
        error: 'DB connection failed',
      }),
    );
  });
});
