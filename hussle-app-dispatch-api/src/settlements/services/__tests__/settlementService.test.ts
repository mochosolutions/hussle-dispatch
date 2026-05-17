import Decimal from 'decimal.js';
import { CarrierType } from '@prisma/client';
import { ConflictError, ValidationError } from '@/shared/errors';
import { MissingEstimatedHoursError } from '@/shared/errors/missingEstimatedHoursError';
import { createSettlementService } from '../settlementService';

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

const buildCarrier = (overrides: Record<string, unknown> = {}) => ({
  id: 'carrier-1',
  managedByOrgId: 'org-1',
  carrierOrgId: null,
  name: 'Test Carrier',
  type: CarrierType.COMPANY_ASSET,
  mcNumber: 'MC123',
  dotNumber: 'DOT123',
  ein: '12-3456789',
  phone: '555-111-2222',
  email: 'ops@test.test',
  address: '101 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  dispatchFeeType: 'PERCENTAGE',
  dispatchFeePercent: new Decimal('10.00'),
  dispatchFeeAmount: new Decimal('0.00'),
  partnerSplitPercent: new Decimal('50.00'),
  feeIncludesAccessorials: false,
  ownerOpPayPercent: null,
  dispatchAgreementOnFile: true,
  dispatchAgreementSignedAt: null,
  insuranceCertOnFile: true,
  insuranceExpiry: null,
  tin: '12-3456789',
  onboardingStatus: null,
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
  status: 'ACTIVE',
  description: null,
  includeExpensesOnSettlement: false,
  createdAt: new Date('2026-03-01T00:00:00.000Z'),
  updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  deletedAt: null,
  ...overrides,
});

const buildLoad = (overrides: Record<string, unknown> = {}) => ({
  id: 'load-1',
  loadNumber: 'L-001',
  carrierRate: new Decimal('2500.00'),
  customerRate: new Decimal('2500.00'),
  carrierPayout: new Decimal('2250.00'),
  dispatchFee: new Decimal('250.00'),
  dispatchFeeOverrideType: null,
  dispatchFeeOverrideAmount: null,
  totalMiles: 500,
  loadedMiles: 500,
  estimatedHours: new Decimal('8.0'),
  deliveredAt: new Date('2026-03-15T00:00:00.000Z'),
  accessorialCharges: [],
  ...overrides,
});

const buildExpense = (overrides: Record<string, unknown> = {}) => ({
  id: 'expense-1',
  description: 'Fuel',
  amount: new Decimal('150.00'),
  date: new Date('2026-03-10T00:00:00.000Z'),
  ...overrides,
});

const BASE_INPUT = {
  organizationId: 'org-1',
  carrierId: 'carrier-1',
  driverId: 'driver-1',
  vehicleId: 'vehicle-1',
  periodStart: new Date('2026-03-01'),
  periodEnd: new Date('2026-03-31'),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('settlementService.generate', () => {
  const mockSettlementRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    addLineItem: jest.fn(),
    updateLineItem: jest.fn(),
    deleteLineItem: jest.fn(),
    findOverlapping: jest.fn(),
    recalculateTotals: jest.fn(),
  };

  const mockLoadQuery = {
    findDeliveredLoads: jest.fn(),
  };

  const mockExpenseQuery = {
    findExpenses: jest.fn(),
  };

  const mockCarrierQuery = {
    findById: jest.fn(),
  };

  const mockDriverQuery = {
    findById: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const service = createSettlementService({
    settlementRepo: mockSettlementRepo,
    loadQuery: mockLoadQuery,
    expenseQuery: mockExpenseQuery,
    carrierQuery: mockCarrierQuery,
    driverQuery: mockDriverQuery,
    logger: mockLogger,
  });

  beforeEach(() => jest.clearAllMocks());

  it('creates DRAFT settlement with line items for COMPANY_ASSET carrier', async () => {
    // Arrange
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const load1 = buildLoad({
      id: 'load-1',
      loadNumber: 'L-001',
      carrierRate: new Decimal('2500.00'),
      dispatchFee: new Decimal('250.00'),
      totalMiles: 500,
      accessorialCharges: [
        { id: 'acc-1', type: 'DETENTION', description: 'Detention fee', amount: new Decimal('100.00') },
      ],
    });
    const load2 = buildLoad({
      id: 'load-2',
      loadNumber: 'L-002',
      carrierRate: new Decimal('3000.00'),
      dispatchFee: new Decimal('300.00'),
      totalMiles: 600,
      accessorialCharges: [
        { id: 'acc-2', type: 'LUMPER', description: 'Lumper fee', amount: new Decimal('50.00') },
      ],
    });
    const expenses = [
      buildExpense({ id: 'exp-1', amount: new Decimal('150.00') }),
      buildExpense({ id: 'exp-2', amount: new Decimal('200.00'), description: 'Tolls' }),
    ];

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load1, load2]);
    mockExpenseQuery.findExpenses.mockResolvedValue(expenses);

    const createdSettlement = { id: 'settlement-1' };
    mockSettlementRepo.create.mockResolvedValue(createdSettlement);

    // Act
    const result = await service.generate(BASE_INPUT);

    // Assert
    expect(result).toBe(createdSettlement);
    expect(mockSettlementRepo.create).toHaveBeenCalledTimes(1);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    // COMPANY_ASSET driver settlement — no DISPATCH_FEE lines (guard).
    // 2 LOAD_REVENUE + 2 ACCESSORIAL + 2 EXPENSE = 6
    expect(createArg.lineItems).toHaveLength(6);

    const types = createArg.lineItems.map((li: { type: string }) => li.type);
    expect(types.filter((t: string) => t === 'LOAD_REVENUE')).toHaveLength(2);
    expect(types.filter((t: string) => t === 'DISPATCH_FEE')).toHaveLength(0);
    expect(types.filter((t: string) => t === 'ACCESSORIAL')).toHaveLength(2);
    expect(types.filter((t: string) => t === 'EXPENSE')).toHaveLength(2);
  });

  it('omits EXPENSE items for LEASED_CARRIER with includeExpensesOnSettlement false', async () => {
    // Arrange
    const carrier = buildCarrier({
      type: CarrierType.LEASED_CARRIER,
      includeExpensesOnSettlement: false,
    });
    const load = buildLoad();

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    // Act
    await service.generate(BASE_INPUT);

    // Assert
    expect(mockExpenseQuery.findExpenses).not.toHaveBeenCalled();

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const expenseItems = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'EXPENSE',
    );
    expect(expenseItems).toHaveLength(0);
  });

  it('includes EXPENSE items for LEASED_CARRIER with includeExpensesOnSettlement true', async () => {
    // Arrange
    const carrier = buildCarrier({
      type: CarrierType.LEASED_CARRIER,
      includeExpensesOnSettlement: true,
    });
    const load = buildLoad();
    const expenses = [buildExpense()];

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue(expenses);
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    // Act
    await service.generate(BASE_INPUT);

    // Assert
    expect(mockExpenseQuery.findExpenses).toHaveBeenCalledTimes(1);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const expenseItems = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'EXPENSE',
    );
    expect(expenseItems).toHaveLength(1);
  });

  it('throws ValidationError for EXTERNAL_CARRIER', async () => {
    // Arrange
    const carrier = buildCarrier({ type: CarrierType.EXTERNAL_CARRIER });
    mockCarrierQuery.findById.mockResolvedValue(carrier);

    // Act & Assert
    await expect(service.generate(BASE_INPUT)).rejects.toThrow(ValidationError);
  });

  it('throws ConflictError when overlapping settlement exists', async () => {
    // Arrange
    const carrier = buildCarrier();
    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue({ id: 'existing-settlement' });

    // Act & Assert
    await expect(service.generate(BASE_INPUT)).rejects.toThrow(ConflictError);
  });

  it('throws ValidationError when no delivered loads in period', async () => {
    // Arrange
    const carrier = buildCarrier();
    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([]);

    // Act & Assert
    await expect(service.generate(BASE_INPUT)).rejects.toThrow(ValidationError);
    await expect(service.generate(BASE_INPUT)).rejects.toThrow(
      'No delivered loads found for the specified period',
    );
  });

  it('computes totals correctly', async () => {
    // Arrange
    // Load 1: revenue 2500, fee 250, accessorial +100
    // Load 2: revenue 3000, fee 300, accessorial +50
    // Expense 1: 150, Expense 2: 200
    // COMPANY_ASSET: no DISPATCH_FEE is deducted on driver settlement.
    // grossRevenue = 2500 + 3000 = 5500
    // dispatchFeeTotal = 0
    // accessorialsTotal = 100 + 50 = 150
    // expensesTotal = 150 + 200 = 350
    // netEarnings = 5500 - 0 + 150 - 350 = 5300
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const load1 = buildLoad({
      id: 'load-1',
      loadNumber: 'L-001',
      carrierRate: new Decimal('2500.00'),
      dispatchFee: new Decimal('250.00'),
      totalMiles: 500,
      accessorialCharges: [
        { id: 'acc-1', type: 'DETENTION', description: 'Detention', amount: new Decimal('100.00') },
      ],
    });
    const load2 = buildLoad({
      id: 'load-2',
      loadNumber: 'L-002',
      carrierRate: new Decimal('3000.00'),
      dispatchFee: new Decimal('300.00'),
      totalMiles: 600,
      accessorialCharges: [
        { id: 'acc-2', type: 'LUMPER', description: 'Lumper', amount: new Decimal('50.00') },
      ],
    });
    const expenses = [
      buildExpense({ id: 'exp-1', amount: new Decimal('150.00') }),
      buildExpense({ id: 'exp-2', amount: new Decimal('200.00') }),
    ];

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load1, load2]);
    mockExpenseQuery.findExpenses.mockResolvedValue(expenses);
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    // Act
    await service.generate(BASE_INPUT);

    // Assert
    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    expect(createArg.grossRevenue).toBe(5500);
    expect(createArg.dispatchFeeTotal).toBe(0);
    expect(createArg.expensesTotal).toBe(350);
    expect(createArg.netEarnings).toBe(5300);
    expect(createArg.totalMiles).toBe(1100);
  });

  it('sums full-precision totals (not the rounded line item amounts)', async () => {
    // Three loads with carrierRate that each rounds the same whether
    // summed before or after rounding. Use values that differ only in the 3rd
    // decimal place to expose round-then-sum drift.
    // Raw: 100.334 + 100.334 + 100.334 = 301.002 → rounds to 301.00
    // Round-then-sum would be: 100.33 + 100.33 + 100.33 = 300.99 (WRONG)
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const loads = [
      buildLoad({
        id: 'load-1',
        loadNumber: 'L-001',
        carrierRate: new Decimal('100.334'),
        dispatchFee: new Decimal('0'),
        accessorialCharges: [],
      }),
      buildLoad({
        id: 'load-2',
        loadNumber: 'L-002',
        carrierRate: new Decimal('100.334'),
        dispatchFee: new Decimal('0'),
        accessorialCharges: [],
      }),
      buildLoad({
        id: 'load-3',
        loadNumber: 'L-003',
        carrierRate: new Decimal('100.334'),
        dispatchFee: new Decimal('0'),
        accessorialCharges: [],
      }),
    ];

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue(loads);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    expect(createArg.grossRevenue).toBe(301);
  });

  // -------------------------------------------------------------------------
  // US-07: DRIVER_PAY line items (COMPANY_ASSET)
  // -------------------------------------------------------------------------

  it('generates DRIVER_PAY line as 85% of carrierPayout for PERCENTAGE driver', async () => {
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const load = buildLoad({
      carrierPayout: new Decimal('2400.00'),
    });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockDriverQuery.findById.mockResolvedValue({
      id: 'driver-1',
      payType: 'PERCENTAGE',
      payRate: new Decimal('85'),
    });
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const driverPayItems = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'DRIVER_PAY',
    );
    expect(driverPayItems).toHaveLength(1);
    expect(driverPayItems[0].amount).toBe(2040);
    expect(driverPayItems[0].referenceId).toBe(load.id);
  });

  it('generates DRIVER_PAY line as miles × rate for PER_MILE driver', async () => {
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const load = buildLoad({ loadedMiles: 500 });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockDriverQuery.findById.mockResolvedValue({
      id: 'driver-1',
      payType: 'PER_MILE',
      payRate: new Decimal('0.55'),
    });
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const driverPayItems = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'DRIVER_PAY',
    );
    expect(driverPayItems).toHaveLength(1);
    expect(driverPayItems[0].amount).toBe(275);
  });

  it('generates DRIVER_PAY line as hours × rate for PER_HOUR driver', async () => {
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const load = buildLoad({ estimatedHours: new Decimal('8.0') });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockDriverQuery.findById.mockResolvedValue({
      id: 'driver-1',
      payType: 'PER_HOUR',
      payRate: new Decimal('25'),
    });
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const driverPayItems = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'DRIVER_PAY',
    );
    expect(driverPayItems).toHaveLength(1);
    expect(driverPayItems[0].amount).toBe(200);
  });

  it('generates one FLAT_RATE DRIVER_PAY line per load', async () => {
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const load1 = buildLoad({ id: 'load-1', loadNumber: 'L-001' });
    const load2 = buildLoad({ id: 'load-2', loadNumber: 'L-002' });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load1, load2]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockDriverQuery.findById.mockResolvedValue({
      id: 'driver-1',
      payType: 'FLAT_RATE',
      payRate: new Decimal('350'),
    });
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const driverPayItems = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'DRIVER_PAY',
    );
    expect(driverPayItems).toHaveLength(2);
    expect(driverPayItems[0].amount).toBe(350);
    expect(driverPayItems[1].amount).toBe(350);
  });

  it('sums DRIVER_PAY correctly across multiple loads', async () => {
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const loads = [1, 2, 3].map((i) =>
      buildLoad({
        id: `load-${i}`,
        loadNumber: `L-00${i}`,
        loadedMiles: 100,
      }),
    );

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue(loads);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockDriverQuery.findById.mockResolvedValue({
      id: 'driver-1',
      payType: 'PER_MILE',
      payRate: new Decimal('1.00'),
    });
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const driverPayItems = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'DRIVER_PAY',
    );
    expect(driverPayItems).toHaveLength(3);
    const total = driverPayItems.reduce(
      (sum: number, li: { amount: number }) => sum + li.amount,
      0,
    );
    expect(total).toBe(300);
  });

  it('computes netEarnings including DRIVER_PAY on COMPANY_ASSET driver settlement', async () => {
    // Arrange
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const loads = [1, 2, 3].map((i) =>
      buildLoad({
        id: `load-${i}`,
        loadNumber: `L-00${i}`,
        loadedMiles: 500,
        carrierRate: new Decimal('0'),
      }),
    );

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue(loads);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockDriverQuery.findById.mockResolvedValue({
      id: 'driver-1',
      payType: 'PER_MILE',
      payRate: new Decimal('0.55'),
    });
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    // Act
    await service.generate(BASE_INPUT);

    // Assert
    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    expect(createArg.netEarnings).toBe(825);
  });

  // -------------------------------------------------------------------------
  // US-08: DISPATCH_FEE deduction for carriers
  // -------------------------------------------------------------------------

  it('adds DISPATCH_FEE deduction for LEASED carrier with PERCENTAGE fee 15%', async () => {
    const carrier = buildCarrier({
      type: CarrierType.LEASED_CARRIER,
      dispatchFeeType: 'PERCENTAGE',
      dispatchFeePercent: new Decimal('15'),
      feeIncludesAccessorials: false,
    });
    const load = buildLoad({ customerRate: new Decimal('3000.00') });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const fees = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'DISPATCH_FEE',
    );
    expect(fees).toHaveLength(1);
    expect(fees[0].amount).toBe(450);
  });

  it('adds DISPATCH_FEE deduction for LEASED carrier with FLAT fee $300', async () => {
    const carrier = buildCarrier({
      type: CarrierType.LEASED_CARRIER,
      dispatchFeeType: 'FLAT',
      dispatchFeeAmount: new Decimal('300.00'),
    });
    const load = buildLoad({ customerRate: new Decimal('3000.00') });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const fees = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'DISPATCH_FEE',
    );
    expect(fees).toHaveLength(1);
    expect(fees[0].amount).toBe(300);
  });

  it('omits DISPATCH_FEE line when LEASED fee resolves to 0', async () => {
    const carrier = buildCarrier({
      type: CarrierType.LEASED_CARRIER,
      dispatchFeeType: 'FLAT',
      dispatchFeeAmount: new Decimal('0'),
      dispatchFeePercent: new Decimal('0'),
    });
    const load = buildLoad({ customerRate: new Decimal('3000.00') });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const fees = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'DISPATCH_FEE',
    );
    expect(fees).toHaveLength(0);
  });

  it('does NOT add DISPATCH_FEE on COMPANY_ASSET driver settlement even when carrier fee > 0', async () => {
    const carrier = buildCarrier({
      type: CarrierType.COMPANY_ASSET,
      dispatchFeeType: 'PERCENTAGE',
      dispatchFeePercent: new Decimal('15'),
    });
    const load = buildLoad({ customerRate: new Decimal('3000.00') });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockDriverQuery.findById.mockResolvedValue(null);
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const fees = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'DISPATCH_FEE',
    );
    expect(fees).toHaveLength(0);
  });

  it('computes LEASED plan example: $3,000 + $200 passthrough − $480 fee = $2,720 net', async () => {
    const carrier = buildCarrier({
      type: CarrierType.LEASED_CARRIER,
      dispatchFeeType: 'PERCENTAGE',
      dispatchFeePercent: new Decimal('15'),
      feeIncludesAccessorials: true,
    });
    const load = buildLoad({
      carrierRate: new Decimal('3000.00'),
      customerRate: new Decimal('3000.00'),
      accessorialCharges: [
        {
          id: 'acc-1',
          type: 'DETENTION',
          description: 'Detention',
          amount: new Decimal('200.00'),
          billTo: 'BOTH',
        },
      ],
    });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    expect(createArg.grossRevenue).toBe(3000);
    expect(createArg.dispatchFeeTotal).toBe(480);
    expect(createArg.netEarnings).toBe(2720);
  });

  it('only includes CARRIER/BOTH accessorials on LEASED carrier settlement', async () => {
    const carrier = buildCarrier({ type: CarrierType.LEASED_CARRIER });
    const load = buildLoad({
      accessorialCharges: [
        {
          id: 'acc-1',
          type: 'DETENTION',
          description: 'Detention',
          amount: new Decimal('100.00'),
          billTo: 'CUSTOMER',
        },
        {
          id: 'acc-2',
          type: 'LUMPER',
          description: 'Lumper',
          amount: new Decimal('50.00'),
          billTo: 'CARRIER',
        },
        {
          id: 'acc-3',
          type: 'LAYOVER',
          description: 'Layover',
          amount: new Decimal('75.00'),
          billTo: 'BOTH',
        },
      ],
    });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    const accs = createArg.lineItems.filter(
      (li: { type: string }) => li.type === 'ACCESSORIAL',
    );
    expect(accs).toHaveLength(2);
    const ids = accs.map((a: { referenceId: string }) => a.referenceId);
    expect(ids).toEqual(expect.arrayContaining(['acc-2', 'acc-3']));
    expect(ids).not.toContain('acc-1');
  });

  // -------------------------------------------------------------------------
  // US-09: PER_HOUR blocks settlement when estimatedHours missing
  // -------------------------------------------------------------------------

  it('throws MissingEstimatedHoursError when PER_HOUR driver has loads missing estimatedHours', async () => {
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const load1 = buildLoad({ id: 'load-1', loadNumber: 'L-001', estimatedHours: new Decimal('8.0') });
    const load2 = buildLoad({ id: 'load-2', loadNumber: 'L-002', estimatedHours: null });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load1, load2]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockDriverQuery.findById.mockResolvedValue({
      id: 'driver-1',
      payType: 'PER_HOUR',
      payRate: new Decimal('25'),
    });

    await expect(service.generate(BASE_INPUT)).rejects.toThrow(MissingEstimatedHoursError);
    await expect(service.generate(BASE_INPUT)).rejects.toMatchObject({
      loadIds: ['load-2'],
      loads: [{ id: 'load-2', loadNumber: 'L-002' }],
    });
    expect(mockSettlementRepo.create).not.toHaveBeenCalled();
  });

  it('generates normally for PER_HOUR driver when all loads have estimatedHours', async () => {
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const load = buildLoad({ estimatedHours: new Decimal('8.0') });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockDriverQuery.findById.mockResolvedValue({
      id: 'driver-1',
      payType: 'PER_HOUR',
      payRate: new Decimal('25'),
    });
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    expect(mockSettlementRepo.create).toHaveBeenCalledTimes(1);
  });

  it('does NOT block PER_MILE driver when loads are missing estimatedHours', async () => {
    const carrier = buildCarrier({ type: CarrierType.COMPANY_ASSET });
    const load = buildLoad({ estimatedHours: null });

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockDriverQuery.findById.mockResolvedValue({
      id: 'driver-1',
      payType: 'PER_MILE',
      payRate: new Decimal('0.55'),
    });
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    expect(mockSettlementRepo.create).toHaveBeenCalledTimes(1);
  });

  it('includes a snapshotHash on the create payload', async () => {
    const carrier = buildCarrier();
    const load = buildLoad();

    mockCarrierQuery.findById.mockResolvedValue(carrier);
    mockSettlementRepo.findOverlapping.mockResolvedValue(null);
    mockLoadQuery.findDeliveredLoads.mockResolvedValue([load]);
    mockExpenseQuery.findExpenses.mockResolvedValue([]);
    mockSettlementRepo.create.mockResolvedValue({ id: 'settlement-1' });

    await service.generate(BASE_INPUT);

    const createArg = mockSettlementRepo.create.mock.calls[0][0];
    expect(createArg.snapshotHash).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
  });
});

describe('settlementService.approve', () => {
  const mockSettlementRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    addLineItem: jest.fn(),
    updateLineItem: jest.fn(),
    deleteLineItem: jest.fn(),
    findOverlapping: jest.fn(),
    recalculateTotals: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const service = createSettlementService({
    settlementRepo: mockSettlementRepo,
    loadQuery: { findDeliveredLoads: jest.fn() },
    expenseQuery: { findExpenses: jest.fn() },
    carrierQuery: { findById: jest.fn() },
    driverQuery: { findById: jest.fn() },
    logger: mockLogger,
  });

  beforeEach(() => jest.clearAllMocks());

  it('throws ConflictError when stored snapshotHash does not match current line items', async () => {
    mockSettlementRepo.findById.mockResolvedValue({
      id: 'settlement-1',
      status: 'DRAFT',
      snapshotHash: 'stale-hash-that-will-never-match',
      lineItems: [
        { type: 'LOAD_REVENUE', referenceId: 'load-1', amount: new Decimal('2500.00') },
      ],
    });

    await expect(
      service.approve({
        organizationId: 'org-1',
        settlementId: 'settlement-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow(ConflictError);

    expect(mockSettlementRepo.update).not.toHaveBeenCalled();
  });

  it('approves when snapshotHash is null (pre-hash settlement)', async () => {
    mockSettlementRepo.findById.mockResolvedValue({
      id: 'settlement-1',
      status: 'DRAFT',
      snapshotHash: null,
      lineItems: [],
    });
    mockSettlementRepo.update.mockResolvedValue({ id: 'settlement-1', status: 'APPROVED' });

    await service.approve({
      organizationId: 'org-1',
      settlementId: 'settlement-1',
      userId: 'user-1',
    });

    expect(mockSettlementRepo.update).toHaveBeenCalledWith(
      'settlement-1',
      'org-1',
      expect.objectContaining({ status: 'APPROVED' }),
    );
  });
});
