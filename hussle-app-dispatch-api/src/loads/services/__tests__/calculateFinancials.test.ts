import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import Decimal from 'decimal.js';
import { calculateAndPersistFinancials } from '../calculateFinancials';
import type { LoadWithRelations, VehicleCpmQueryPort, DispatcherProfileQueryPort } from '../../types/loadTypes';
import type { LoadStatusRepoPort } from '../../types/loadStatusTypes';
import type { Logger } from '../../../shared/utils/logger';

// ---------------------------------------------------------------------------
// Base carrier fixture
// ---------------------------------------------------------------------------

const baseCarrier: NonNullable<LoadWithRelations['carrier']> = {
  id: 'carrier-1',
  managedByOrgId: 'org-1',
  carrierOrgId: null,
  name: 'Fleet Carrier',
  type: 'COMPANY_ASSET',
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
  feeType: 'PER_LOAD_PERCENT',
  payFromNet: false,
  includeExpensesOnSettlement: false,
  ownerOpPayPercent: null,
  dispatchAgreementOnFile: true,
  dispatchAgreementSignedAt: null,
  insuranceCertOnFile: true,
  insuranceExpiry: null,
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
  billingMethod: 'DIRECT',
  factoringCompanyName: null,
  factoringCompanyEmail: null,
  factoringSubmissionMethod: null,
  factoringAdvanceRate: null,
  factoringFeePercent: null,
  factoringNoa: null,
  outboundEmailMode: 'MANUAL',
  replyToEmail: null,
  description: null,
  status: 'ACTIVE',
  lat: null,
  lng: null,
  legalName: null,
  dbaName: null,
  taxClassification: null,
  tinType: null,
  signatoryName: null,
  signatoryTitle: null,
  signedAgreementId: null,
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

// ---------------------------------------------------------------------------
// buildLoad helper
// ---------------------------------------------------------------------------

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
    loadedMiles: null,
    deadheadMiles: null,
    totalMiles: null,
    customerRate: new Decimal('2800.00'),
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
    carrier: baseCarrier,
    driver: null,
    vehicle: null,
    contact: null,
    customer: null,
    statusHistory: [],
    checkCalls: [],
    accessorialCharges: [],
    invoiceReadiness: 'NOT_READY',
  };

  return { ...base, ...overrides };
};

// ---------------------------------------------------------------------------
// Stop builder helper
// ---------------------------------------------------------------------------

const buildStop = (
  overrides: Partial<LoadWithRelations['stops'][number]> & {
    type: 'PICKUP' | 'DELIVERY';
    sequence: number;
  },
): LoadWithRelations['stops'][number] => ({
  id: `stop-${overrides.sequence}`,
  loadId: 'load-1',
  contactId: null,
  placeId: null,
  resolutionStatus: 'UNRESOLVED',
  place: null,
  facilityName: null,
  address: null,
  city: null,
  state: null,
  zip: null,
  schedulingType: 'FCFS',
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
  ...overrides,
});

// ---------------------------------------------------------------------------
// Driver builder helper
// ---------------------------------------------------------------------------

const buildDriver = (
  overrides: Partial<NonNullable<LoadWithRelations['driver']>> & {
    payType: string;
    payRate: Decimal;
  },
): NonNullable<LoadWithRelations['driver']> => ({
  id: 'driver-1',
  carrierId: 'carrier-1',
  firstName: 'Alex',
  lastName: 'Driver',
  phone: null,
  email: null,
  licenseType: 'CLASS_D',
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
  maxDaysOut: 5,
  preferredLanes: null,
  weeklySchedule: null,
  freightPreferences: null,
  noGoZones: null,
  isAvailable: true,
  status: 'ACTIVE',
  timezone: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mock deps
// ---------------------------------------------------------------------------

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

const mockVehicleCpmQuery: jest.Mocked<VehicleCpmQueryPort> = {
  getRecurringExpenses: jest.fn(),
  getActualExpenseSummary: jest.fn(),
};

const mockDispatcherProfileQuery: jest.Mocked<DispatcherProfileQueryPort> = {
  findByUserId: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLoadStatusRepo.sumAccessorialCharges.mockResolvedValue('0.00');
  mockLoadStatusRepo.updateFinancials.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// T-04: vehicleCpm integration
// ---------------------------------------------------------------------------

describe('calculateAndPersistFinancials — vehicleCpm (T-04)', () => {
  it('calls updateFinancials with non-null estimatedCost when vehicle has expenses and totalMiles set', async () => {
    // Arrange
    // vehicleCpm = 500/1000 = 0.5, totalMiles=800 → estimatedCost = 0.5*800 = 400.00
    mockVehicleCpmQuery.getRecurringExpenses.mockResolvedValue([
      { amount: 500, milesPerMonth: 1000 },
    ]);

    const load = buildLoad({ vehicleId: 'vehicle-1', totalMiles: 800 });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      vehicleCpmQuery: mockVehicleCpmQuery,
      organizationId: 'org-1',
    });

    // Assert
    expect(mockVehicleCpmQuery.getRecurringExpenses).toHaveBeenCalledWith('vehicle-1');
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ estimatedCost: '400.00' }),
    );
  });

  it('calls updateFinancials with null estimatedCost when vehicleCpmQuery returns empty array', async () => {
    // Arrange — CPM = 0 when no expenses, so vehicleCpm stays undefined
    mockVehicleCpmQuery.getRecurringExpenses.mockResolvedValue([]);

    const load = buildLoad({ vehicleId: 'vehicle-1', totalMiles: 800 });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      vehicleCpmQuery: mockVehicleCpmQuery,
      organizationId: 'org-1',
    });

    // Assert
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ estimatedCost: null }),
    );
  });

  it('does not call vehicleCpmQuery when vehicleId is null', async () => {
    // Arrange
    const load = buildLoad({ vehicleId: null, totalMiles: 800 });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      vehicleCpmQuery: mockVehicleCpmQuery,
      organizationId: 'org-1',
    });

    // Assert
    expect(mockVehicleCpmQuery.getRecurringExpenses).not.toHaveBeenCalled();
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ estimatedCost: null }),
    );
  });

  it('calls updateFinancials with null estimatedCost when totalMiles is null even with valid CPM', async () => {
    // Arrange — CPM is valid but totalMiles=null so estimatedCost cannot be computed
    mockVehicleCpmQuery.getRecurringExpenses.mockResolvedValue([
      { amount: 500, milesPerMonth: 1000 },
    ]);

    const load = buildLoad({ vehicleId: 'vehicle-1', totalMiles: null });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      vehicleCpmQuery: mockVehicleCpmQuery,
      organizationId: 'org-1',
    });

    // Assert
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ estimatedCost: null }),
    );
  });
});

// ---------------------------------------------------------------------------
// T-08: dispatcher commission integration
// ---------------------------------------------------------------------------

describe('calculateAndPersistFinancials — dispatcherComm (T-08)', () => {
  it('calls updateFinancials with non-null dispatcherComm for PERCENTAGE_OF_MARGIN profile', async () => {
    // Arrange
    // dispatchFeePercent=10%, customerRate=2800 → companyMargin=280
    // commissionRate=10% → dispatcherComm = 280 * 10/100 = 28.00
    mockDispatcherProfileQuery.findByUserId.mockResolvedValue({
      commissionType: 'PERCENTAGE_OF_MARGIN',
      commissionRate: '10',
    });

    const load = buildLoad({ dispatcherUserId: 'user-1' });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      dispatcherProfileQuery: mockDispatcherProfileQuery,
      organizationId: 'org-1',
    });

    // Assert
    expect(mockDispatcherProfileQuery.findByUserId).toHaveBeenCalledWith('user-1', 'org-1');
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ dispatcherComm: '28.00' }),
    );
  });

  it('does not call dispatcherProfileQuery when dispatcherUserId is null', async () => {
    // Arrange
    const load = buildLoad({ dispatcherUserId: null });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      dispatcherProfileQuery: mockDispatcherProfileQuery,
      organizationId: 'org-1',
    });

    // Assert
    expect(mockDispatcherProfileQuery.findByUserId).not.toHaveBeenCalled();
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ dispatcherComm: null }),
    );
  });

  it('calls updateFinancials with null dispatcherComm when profile not found', async () => {
    // Arrange
    mockDispatcherProfileQuery.findByUserId.mockResolvedValue(null);

    const load = buildLoad({ dispatcherUserId: 'user-99' });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      dispatcherProfileQuery: mockDispatcherProfileQuery,
      organizationId: 'org-1',
    });

    // Assert
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ dispatcherComm: null }),
    );
  });

  it('calls updateFinancials with correct flat amount for FLAT_PER_LOAD commission', async () => {
    // Arrange
    // commissionType=FLAT_PER_LOAD, commissionRate=75 → dispatcherComm=75.00
    mockDispatcherProfileQuery.findByUserId.mockResolvedValue({
      commissionType: 'FLAT_PER_LOAD',
      commissionRate: '75',
    });

    const load = buildLoad({ dispatcherUserId: 'user-1' });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      dispatcherProfileQuery: mockDispatcherProfileQuery,
      organizationId: 'org-1',
    });

    // Assert
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ dispatcherComm: '75.00' }),
    );
  });
});

// ---------------------------------------------------------------------------
// T-17: estimatedHours derivation
// ---------------------------------------------------------------------------

describe('calculateAndPersistFinancials — estimatedHours derivation (T-17)', () => {
  it('derives estimatedHours from stops when PER_HOUR driver has no load.estimatedHours', async () => {
    // Arrange
    // Pickup at 08:00, Delivery at 20:00 → 12 hours → driverPay = 25 * 12 = 300.00
    const pickupTime = new Date('2026-03-01T08:00:00.000Z');
    const deliveryTime = new Date('2026-03-01T20:00:00.000Z');

    const load = buildLoad({
      driver: buildDriver({ payType: 'PER_HOUR', payRate: new Decimal('25.00') }),
      driverId: 'driver-1',
      estimatedHours: null,
      stops: [
        buildStop({ type: 'PICKUP', sequence: 1, appointmentStart: pickupTime }),
        buildStop({ type: 'DELIVERY', sequence: 2, appointmentStart: deliveryTime }),
      ],
    });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      organizationId: 'org-1',
    });

    // Assert — 12 hours × $25.00/hr = $300.00
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ driverPay: '300.00' }),
    );
  });

  it('uses load.estimatedHours instead of deriving from stops when already set', async () => {
    // Arrange
    // load.estimatedHours=8, stops span 12 hours — should use 8, not 12
    // driverPay = 25 * 8 = 200.00
    const pickupTime = new Date('2026-03-01T08:00:00.000Z');
    const deliveryTime = new Date('2026-03-01T20:00:00.000Z');

    const load = buildLoad({
      driver: buildDriver({ payType: 'PER_HOUR', payRate: new Decimal('25.00') }),
      driverId: 'driver-1',
      estimatedHours: new Decimal('8'),
      stops: [
        buildStop({ type: 'PICKUP', sequence: 1, appointmentStart: pickupTime }),
        buildStop({ type: 'DELIVERY', sequence: 2, appointmentStart: deliveryTime }),
      ],
    });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      organizationId: 'org-1',
    });

    // Assert — 8 hours × $25.00/hr = $200.00 (not 12 × $25 = $300)
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ driverPay: '200.00' }),
    );
  });

  it('results in null driverPay for PER_HOUR driver when stops have no appointment times', async () => {
    // Arrange — stops exist but no appointmentStart, so hours cannot be derived
    const load = buildLoad({
      driver: buildDriver({ payType: 'PER_HOUR', payRate: new Decimal('25.00') }),
      driverId: 'driver-1',
      estimatedHours: null,
      stops: [
        buildStop({ type: 'PICKUP', sequence: 1 }),
        buildStop({ type: 'DELIVERY', sequence: 2 }),
      ],
    });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      organizationId: 'org-1',
    });

    // Assert — no hours derivable → driverPay null
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ driverPay: null }),
    );
  });

  it('does not use estimatedHours for PERCENTAGE driver — uses carrierPayout instead', async () => {
    // Arrange — PERCENTAGE driver; stops have appointments but they should be ignored
    // carrierPayout = 2800 - 280 = 2520, driverPay = 2520 * 50/100 = 1260.00
    const pickupTime = new Date('2026-03-01T08:00:00.000Z');
    const deliveryTime = new Date('2026-03-01T20:00:00.000Z');

    const load = buildLoad({
      driver: buildDriver({ payType: 'PERCENTAGE', payRate: new Decimal('50') }),
      driverId: 'driver-1',
      estimatedHours: null,
      stops: [
        buildStop({ type: 'PICKUP', sequence: 1, appointmentStart: pickupTime }),
        buildStop({ type: 'DELIVERY', sequence: 2, appointmentStart: deliveryTime }),
      ],
    });

    // Act
    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      organizationId: 'org-1',
    });

    // Assert — PERCENTAGE driver yields 1260.00, not a hours-based result
    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({ driverPay: '1260.00' }),
    );
  });
});

// ---------------------------------------------------------------------------
// ratePerTotalMile (trip-miles)
// ---------------------------------------------------------------------------

describe('calculateAndPersistFinancials — ratePerTotalMile (trip-miles)', () => {
  it('persists ratePerTotalMile when loadedMiles and totalMiles are set', async () => {
    // customerRate=2800, loadedMiles=800, totalMiles=900
    // ratePerMile = 2800/800 = 3.50
    // ratePerTotalMile = 2800/900 = 3.11
    const load = buildLoad({ loadedMiles: 800, totalMiles: 900 });

    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      organizationId: 'org-1',
    });

    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({
        ratePerMile: '3.50',
        ratePerTotalMile: '3.11',
      }),
    );
  });

  it('persists null ratePerTotalMile when totalMiles is null', async () => {
    const load = buildLoad({ loadedMiles: 800, totalMiles: null });

    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      organizationId: 'org-1',
    });

    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({
        ratePerMile: '3.50',
        ratePerTotalMile: null,
      }),
    );
  });

  it('persists null ratePerTotalMile when totalMiles is 0', async () => {
    const load = buildLoad({ loadedMiles: 800, totalMiles: 0 });

    await calculateAndPersistFinancials('load-1', {
      load,
      loadStatusRepo: mockLoadStatusRepo,
      logger: mockLogger,
      organizationId: 'org-1',
    });

    expect(mockLoadStatusRepo.updateFinancials).toHaveBeenCalledWith(
      'load-1',
      expect.objectContaining({
        ratePerTotalMile: null,
      }),
    );
  });
});
