import { describe, expect, it } from '@jest/globals';
import Decimal from 'decimal.js';
import { toLoadDetailResponse, toLoadListItemResponse } from '../loadTransformer';
import type { LoadListItem, LoadWithRelations } from '../../../types/loadTypes';

// ---------------------------------------------------------------------------
// Test fixtures
//
// US-11: the transformer now computes financial outputs from Load snapshot
// INPUT columns (customerRate, dispatchFeeType, dispatchFeeAmount, etc.) via
// computeLoadFinancials, rather than reading the persisted output cache
// columns (dispatchFee, carrierPayout, companyMargin, …). Tests drive the
// inputs and assert on the computed outputs.
// ---------------------------------------------------------------------------

const buildLoad = (overrides?: Partial<LoadWithRelations>): LoadWithRelations => {
  const base: LoadWithRelations = {
    id: 'load-1',
    organizationId: 'org-1',
    loadNumber: 'L-1001',
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
    // US-14: persisted output cache columns (dispatchFee, partnerSplit,
    // ratePerMile, ratePerTotalMile, carrierPayout, companyMargin, driverPay,
    // estimatedCost, dispatcherComm, invoiceReadiness) have been removed —
    // they are now derived on read via computeLoadFinancials /
    // computeInvoiceReadiness from snapshot input columns.
    estimatedHours: null,
    version: 0,
    status: 'BOOKED',
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
    dispatchFeeType: null,
    dispatchFeeAmount: null,
    partnerSplitPercent: null,
    driverPayType: null,
    driverPayRate: null,
    dispatcherCommissionType: null,
    dispatcherCommissionRate: null,
    feeIncludesAccessorials: null,
    payFromNet: null,
    carrierType: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
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
    _count: { invoices: 0 },
  };

  return { ...base, ...overrides };
};

const buildListItem = (overrides?: Partial<LoadListItem>): LoadListItem => {
  const base: LoadListItem = {
    id: 'load-1',
    organizationId: 'org-1',
    loadNumber: 'L-1001',
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
    estimatedHours: null,
    version: 0,
    status: 'BOOKED',
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
    dispatchFeeType: null,
    dispatchFeeAmount: null,
    partnerSplitPercent: null,
    driverPayType: null,
    driverPayRate: null,
    dispatcherCommissionType: null,
    dispatcherCommissionRate: null,
    feeIncludesAccessorials: null,
    payFromNet: null,
    carrierType: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    stops: [],
    carrier: null,
    driver: null,
    contact: null,
    customer: null,
    accessorialCharges: [],
    _count: { accessorialCharges: 0, invoices: 0 },
  };

  return { ...base, ...overrides };
};

const makeDriver = (overrides?: Partial<LoadWithRelations['driver'] & object>) => ({
  id: 'd-1',
  carrierId: 'c-1',
  firstName: 'John',
  lastName: 'Doe',
  phone: null,
  email: null,
  licenseType: 'CDL_A' as const,
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
  status: 'ACTIVE' as const,
  timezone: null,
  notes: null,
  payType: 'PERCENTAGE' as const,
  payRate: new Decimal('0'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  ...overrides,
});

const makeCarrierListItem = (overrides?: Partial<LoadListItem['carrier'] & object>) => ({
  id: 'c-1',
  name: 'FastTruck',
  ...overrides,
});

const makeDriverListItem = (overrides?: Partial<LoadListItem['driver'] & object>) => ({
  id: 'd-1',
  firstName: 'John',
  lastName: 'Doe',
  ...overrides,
});

const makeAccessorial = (amount: string) => ({
  id: `acc-${amount}`,
  loadId: 'load-1',
  documentId: null,
  type: 'FUEL_SURCHARGE' as const,
  description: null,
  amount: new Decimal(amount),
  billTo: 'CUSTOMER',
  isAutoGenerated: false,
  approvalStatus: 'NONE' as const,
  approvalSource: null,
  approvalNotes: null,
  stopId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

// ---------------------------------------------------------------------------
// toLoadDetailResponse — computed financial fields (US-11)
//
// Baseline inputs: EXTERNAL_CARRIER + 10% dispatch fee, no partner split,
// no driver pay, no dispatcher commission, no vehicle CPM.
// ---------------------------------------------------------------------------

const buildPricedLoad = (overrides?: Partial<LoadWithRelations>): LoadWithRelations =>
  buildLoad({
    customerRate: new Decimal('2800.00'),
    loadedMiles: 800,
    totalMiles: 850,
    carrierType: 'EXTERNAL_CARRIER',
    dispatchFeeType: 'PERCENTAGE',
    dispatchFeeAmount: new Decimal('10'),
    feeIncludesAccessorials: false,
    payFromNet: false,
    ...overrides,
  });

describe('toLoadDetailResponse', () => {
  describe('computed cache outputs', () => {
    it('computes dispatchFee from PERCENTAGE input (10% of 2800 = 280)', () => {
      const result = toLoadDetailResponse(buildPricedLoad());

      expect(result.financials.dispatchFee).toBe('280.00');
      expect(result.financials.companyMargin).toBe('280.00');
      expect(result.financials.carrierPayout).toBe('2520.00');
    });

    it('returns null financials when customerRate is null', () => {
      const result = toLoadDetailResponse(buildLoad({ customerRate: null }));

      expect(result.financials.dispatchFee).toBeNull();
      expect(result.financials.carrierPayout).toBeNull();
      expect(result.financials.companyMargin).toBeNull();
      expect(result.financials.ratePerMile).toBeNull();
    });
  });

  describe('carrierRpm', () => {
    it('computes carrierRpm as carrierPayout / loadedMiles', () => {
      // carrierPayout = 2520, loadedMiles = 800 → 3.15
      const result = toLoadDetailResponse(buildPricedLoad());

      expect(result.financials.carrierRpm).toBe('3.15');
    });

    it('returns null when customerRate is null', () => {
      const result = toLoadDetailResponse(
        buildLoad({ customerRate: null, loadedMiles: 800 }),
      );

      expect(result.financials.carrierRpm).toBeNull();
    });

    it('returns null when loadedMiles is null', () => {
      const result = toLoadDetailResponse(buildPricedLoad({ loadedMiles: null }));

      expect(result.financials.carrierRpm).toBeNull();
    });

    it('returns null when loadedMiles is 0', () => {
      const result = toLoadDetailResponse(buildPricedLoad({ loadedMiles: 0 }));

      expect(result.financials.carrierRpm).toBeNull();
    });
  });

  describe('companyNet', () => {
    it('computes companyNet as companyMargin - dispatcherComm', () => {
      // companyMargin = 280, dispatcherComm = 20% of margin = 56 → 224
      const load = buildPricedLoad({
        dispatcherCommissionType: 'PERCENTAGE_OF_MARGIN',
        dispatcherCommissionRate: new Decimal('20'),
      });

      const result = toLoadDetailResponse(load);

      expect(result.financials.dispatcherComm).toBe('56.00');
      expect(result.financials.companyNet).toBe('224.00');
    });

    it('returns null when dispatcherComm is null (no commission configured)', () => {
      const result = toLoadDetailResponse(buildPricedLoad());

      expect(result.financials.dispatcherComm).toBeNull();
      expect(result.financials.companyNet).toBeNull();
    });

    it('returns null when customerRate is null', () => {
      const result = toLoadDetailResponse(buildLoad({ customerRate: null }));

      expect(result.financials.companyNet).toBeNull();
    });
  });

  describe('marginPercent', () => {
    it('computes marginPercent as companyMargin / customerRate * 100 with no accessorials', () => {
      // companyMargin = 280, gross = 2800 → 10.00%
      const result = toLoadDetailResponse(buildPricedLoad());

      expect(result.financials.marginPercent).toBe('10.00');
    });

    it('computes marginPercent including accessorials in gross', () => {
      // gross = 2800 + 200 = 3000; companyMargin = 10% of (2800) = 280
      // (feeIncludesAccessorials=false so dispatchFee fee base excludes
      // accessorials); marginPercent = 280 / 3000 * 100 = 9.33
      const load = buildPricedLoad({
        accessorialCharges: [makeAccessorial('200.00')],
      });

      const result = toLoadDetailResponse(load);

      expect(result.financials.marginPercent).toBe('9.33');
    });

    it('returns null when customerRate is null', () => {
      const result = toLoadDetailResponse(buildLoad({ customerRate: null }));

      expect(result.financials.marginPercent).toBeNull();
    });
  });

  describe('estimatedNetEarnings', () => {
    it('returns null when estimatedCost is null (no vehicle CPM configured)', () => {
      // estimatedCost is derived from vehicleCpm (extras), not snapshotted on
      // the load. Without vehicleCpm, estimatedCost is null → net is null.
      const result = toLoadDetailResponse(buildPricedLoad());

      expect(result.financials.estimatedCost).toBeNull();
      expect(result.financials.estimatedNetEarnings).toBeNull();
    });

    it('returns null when customerRate is null', () => {
      const result = toLoadDetailResponse(buildLoad({ customerRate: null }));

      expect(result.financials.estimatedNetEarnings).toBeNull();
    });
  });

  describe('grouped structure', () => {
    it('groups route fields correctly', () => {
      const load = buildLoad({
        loadedMiles: 500,
        deadheadMiles: 50,
        totalMiles: 550,
        estimatedHours: new Decimal('8.5'),
      });

      const result = toLoadDetailResponse(load);

      expect(result.route.loadedMiles).toBe(500);
      expect(result.route.deadheadMiles).toBe(50);
      expect(result.route.totalMiles).toBe(550);
      expect(result.route.estimatedHours).toBe('8.5');
      expect(result.route.stops).toEqual([]);
    });

    it('groups assignment fields correctly', () => {
      const load = buildLoad({
        isTeamDriver: true,
        carrier: null,
        driver: makeDriver(),
        vehicle: null,
      });

      const result = toLoadDetailResponse(load);

      expect(result.assignment.isTeamDriver).toBe(true);
      expect(result.assignment.driver).toEqual({
        id: 'd-1',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        currentLatitude: null,
        currentLongitude: null,
      });
      expect(result.assignment.carrier).toBeNull();
      expect(result.assignment.vehicle).toBeNull();
    });

    it('groups activity fields correctly', () => {
      const result = toLoadDetailResponse(buildLoad());

      expect(result.activity.statusHistory).toEqual([]);
      expect(result.activity.checkCalls).toEqual([]);
      expect(result.activity.accessorialCharges).toEqual([]);
    });
  });

  describe('invoiceReadiness (US-11 / US-32)', () => {
    it('returns NOT_READY for BOOKED loads', () => {
      const result = toLoadDetailResponse(buildLoad({ status: 'BOOKED' }));

      expect(result.tracking.invoiceReadiness).toBe('NOT_READY');
    });

    it('returns AWAITING_DOCUMENTS for DELIVERED loads with no documents', () => {
      const result = toLoadDetailResponse(buildLoad({ status: 'DELIVERED' }));

      expect(result.tracking.invoiceReadiness).toBe('AWAITING_DOCUMENTS');
    });

    it('returns READY for DELIVERED loads with all required documents', () => {
      const result = toLoadDetailResponse(buildLoad({ status: 'DELIVERED' }), {
        documents: [
          { type: 'BROKER_RATE_CON' },
          { type: 'BOL_SIGNED' },
          { type: 'POD' },
        ],
      });

      expect(result.tracking.invoiceReadiness).toBe('READY');
    });

    it('returns AWAITING_DOCUMENTS for DELIVERED loads missing one document', () => {
      const result = toLoadDetailResponse(buildLoad({ status: 'DELIVERED' }), {
        documents: [{ type: 'BROKER_RATE_CON' }, { type: 'BOL_SIGNED' }],
      });

      expect(result.tracking.invoiceReadiness).toBe('AWAITING_DOCUMENTS');
    });

    it('returns INVOICE_CREATED when load has at least one invoice', () => {
      const load = buildLoad({ status: 'INVOICE_PENDING' });
      load._count = { invoices: 1 };

      const result = toLoadDetailResponse(load);

      expect(result.tracking.invoiceReadiness).toBe('INVOICE_CREATED');
    });

    it('groups tracking timestamp fields correctly', () => {
      const result = toLoadDetailResponse(
        buildLoad({
          rateConReceivedAt: new Date('2026-02-01T00:00:00.000Z'),
          bolUnsignedAt: null,
          bolSignedAt: null,
        }),
      );

      expect(result.tracking.rateConReceivedAt).toBe('2026-02-01T00:00:00.000Z');
      expect(result.tracking.bolUnsignedAt).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// toLoadListItemResponse — computed financial fields (US-11)
// ---------------------------------------------------------------------------

const buildPricedListItem = (overrides?: Partial<LoadListItem>): LoadListItem =>
  buildListItem({
    customerRate: new Decimal('2800.00'),
    loadedMiles: 800,
    totalMiles: 850,
    carrierType: 'EXTERNAL_CARRIER',
    dispatchFeeType: 'PERCENTAGE',
    dispatchFeeAmount: new Decimal('10'),
    feeIncludesAccessorials: false,
    payFromNet: false,
    ...overrides,
  });

describe('toLoadListItemResponse', () => {
  it('computes companyMargin and carrierPayout from snapshot inputs', () => {
    const result = toLoadListItemResponse(buildPricedListItem());

    expect(result.financials.companyMargin).toBe('280.00');
    expect(result.financials.carrierPayout).toBe('2520.00');
  });

  it('computes companyNet as companyMargin - dispatcherComm', () => {
    const load = buildPricedListItem({
      dispatcherCommissionType: 'PERCENTAGE_OF_MARGIN',
      dispatcherCommissionRate: new Decimal('20'),
    });

    const result = toLoadListItemResponse(load);

    expect(result.financials.companyNet).toBe('224.00');
  });

  it('returns null companyNet when dispatcherComm is null', () => {
    const result = toLoadListItemResponse(buildPricedListItem());

    expect(result.financials.companyNet).toBeNull();
  });

  it('returns all-null financials when customerRate is null', () => {
    const result = toLoadListItemResponse(buildListItem({ customerRate: null }));

    expect(result.financials.companyMargin).toBeNull();
    expect(result.financials.carrierPayout).toBeNull();
    expect(result.financials.ratePerMile).toBeNull();
  });

  it('groups route fields correctly', () => {
    const result = toLoadListItemResponse(buildListItem({ totalMiles: 500 }));

    expect(result.route.totalMiles).toBe(500);
    expect(result.route.stops).toEqual([]);
  });

  it('groups assignment fields correctly', () => {
    const load = buildListItem({
      carrierId: 'c-1',
      carrier: makeCarrierListItem(),
      driverId: 'd-1',
      driver: makeDriverListItem(),
    });

    const result = toLoadListItemResponse(load);

    expect(result.assignment.carrier).toEqual({ id: 'c-1', name: 'FastTruck' });
    expect(result.assignment.driver).toEqual({
      id: 'd-1',
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('returns INVOICE_CREATED when _count.invoices > 0', () => {
    const result = toLoadListItemResponse(
      buildListItem({
        status: 'INVOICE_PENDING',
        _count: { accessorialCharges: 0, invoices: 1 },
      }),
    );

    expect(result.invoiceReadiness).toBe('INVOICE_CREATED');
  });

  it('returns AWAITING_DOCUMENTS for DELIVERED list rows (no docs fetched in list)', () => {
    const result = toLoadListItemResponse(buildListItem({ status: 'DELIVERED' }));

    expect(result.invoiceReadiness).toBe('AWAITING_DOCUMENTS');
  });
});
