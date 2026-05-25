import { describe, expect, it } from '@jest/globals';
import Decimal from 'decimal.js';
import type { Load, Document } from '@prisma/client';
import { computeLoadFinancials, computeInvoiceReadiness } from '../derivedFinancials';

// ---------------------------------------------------------------------------
// buildLoad helper — only the columns that matter for the calc are required;
// the rest are filled with safe zero/null values so we can satisfy the Load
// type without bringing in every relation field.
// ---------------------------------------------------------------------------

const buildLoad = (overrides?: Partial<Load>): Load => {
  const base: Load = {
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
    invoiceReadiness: 'NOT_READY',
    // US-09 snapshot columns
    dispatchFeeType: 'PERCENTAGE',
    dispatchFeeAmount: new Decimal('10.0000'),
    partnerSplitPercent: new Decimal('50.0000'),
    driverPayType: null,
    driverPayRate: null,
    dispatcherCommissionType: null,
    dispatcherCommissionRate: null,
    feeIncludesAccessorials: false,
    payFromNet: false,
  };

  return { ...base, ...overrides };
};

// ---------------------------------------------------------------------------
// computeLoadFinancials — happy path (math is exhaustively tested upstream)
// ---------------------------------------------------------------------------

describe('computeLoadFinancials', () => {
  it('returns a financial result with dispatchFee derived from Load snapshot columns', () => {
    // Arrange: customerRate=2800, dispatchFeeAmount=10% → dispatchFee=280.00
    const load = buildLoad();

    // Act
    const result = computeLoadFinancials(load, new Decimal(0), {
      carrierType: 'EXTERNAL_CARRIER',
    });

    // Assert
    expect(result.dispatchFee).toBe('280.00');
    expect(result.partnerSplit).toBe('1400.00'); // 2800 * 50%
  });

  it('returns driverPay null when load.driverPayType is null', () => {
    const load = buildLoad();

    const result = computeLoadFinancials(load, new Decimal(0), {
      carrierType: 'EXTERNAL_CARRIER',
    });

    expect(result.driverPay).toBeNull();
  });

  it('returns dispatcherComm null when load.dispatcherCommissionType is null', () => {
    const load = buildLoad();

    const result = computeLoadFinancials(load, new Decimal(0), {
      carrierType: 'EXTERNAL_CARRIER',
    });

    expect(result.dispatcherComm).toBeNull();
  });

  it('throws when load.customerRate is null', () => {
    const load = buildLoad({ customerRate: null });

    expect(() =>
      computeLoadFinancials(load, new Decimal(0), { carrierType: 'EXTERNAL_CARRIER' }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// computeInvoiceReadiness — mirrors invoiceReadinessSubscriber rule
// ---------------------------------------------------------------------------

const buildDoc = (type: string): Pick<Document, 'type'> => ({
  type: type as Document['type'],
});

describe('computeInvoiceReadiness', () => {
  it('returns READY for DELIVERED load with all three required docs', () => {
    const docs = [
      buildDoc('BROKER_RATE_CON'),
      buildDoc('BOL_SIGNED'),
      buildDoc('POD'),
    ];

    expect(computeInvoiceReadiness({ status: 'DELIVERED' }, docs)).toBe('READY');
  });

  it('returns READY for INVOICE_PENDING load with all three required docs', () => {
    const docs = [
      buildDoc('BROKER_RATE_CON'),
      buildDoc('BOL_SIGNED'),
      buildDoc('POD'),
    ];

    expect(computeInvoiceReadiness({ status: 'INVOICE_PENDING' }, docs)).toBe('READY');
  });

  it('returns NOT_READY when status is BOOKED (not delivered)', () => {
    const docs = [
      buildDoc('BROKER_RATE_CON'),
      buildDoc('BOL_SIGNED'),
      buildDoc('POD'),
    ];

    expect(computeInvoiceReadiness({ status: 'BOOKED' }, docs)).toBe('NOT_READY');
  });

  it('returns AWAITING_DOCUMENTS when delivered but missing BROKER_RATE_CON', () => {
    const docs = [buildDoc('BOL_SIGNED'), buildDoc('POD')];

    expect(computeInvoiceReadiness({ status: 'DELIVERED' }, docs)).toBe('AWAITING_DOCUMENTS');
  });

  it('returns AWAITING_DOCUMENTS when delivered but missing BOL_SIGNED', () => {
    const docs = [buildDoc('BROKER_RATE_CON'), buildDoc('POD')];

    expect(computeInvoiceReadiness({ status: 'DELIVERED' }, docs)).toBe('AWAITING_DOCUMENTS');
  });

  it('returns AWAITING_DOCUMENTS when delivered but missing POD', () => {
    const docs = [buildDoc('BROKER_RATE_CON'), buildDoc('BOL_SIGNED')];

    expect(computeInvoiceReadiness({ status: 'DELIVERED' }, docs)).toBe('AWAITING_DOCUMENTS');
  });

  it('returns AWAITING_DOCUMENTS when delivered with no docs at all', () => {
    expect(computeInvoiceReadiness({ status: 'DELIVERED' }, [])).toBe('AWAITING_DOCUMENTS');
  });
});
