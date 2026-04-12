import Decimal from 'decimal.js';
import { CarrierType } from '@prisma/client';
import {
  ConflictError,
  OwnerOperatorNotSupportedError,
  ValidationError,
} from '@/shared/errors';
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
  dispatchFeePercent: new Decimal('10.00'),
  partnerSplitPercent: new Decimal('50.00'),
  feeIncludesAccessorials: false,
  ownerOpPayPercent: null,
  dispatchAgreementOnFile: true,
  dispatchAgreementSignedAt: null,
  insuranceCertOnFile: true,
  insuranceExpiry: null,
  w9OnFile: true,
  carrierPacketOnFile: true,
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
  dispatchFee: new Decimal('250.00'),
  totalMiles: 500,
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
    // 2 LOAD_REVENUE + 2 DISPATCH_FEE + 2 ACCESSORIAL + 2 EXPENSE = 8
    expect(createArg.lineItems).toHaveLength(8);

    const types = createArg.lineItems.map((li: { type: string }) => li.type);
    expect(types.filter((t: string) => t === 'LOAD_REVENUE')).toHaveLength(2);
    expect(types.filter((t: string) => t === 'DISPATCH_FEE')).toHaveLength(2);
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

  it('throws OwnerOperatorNotSupportedError for OWNER_OPERATOR', async () => {
    // Arrange
    const carrier = buildCarrier({ type: CarrierType.OWNER_OPERATOR });
    mockCarrierQuery.findById.mockResolvedValue(carrier);

    // Act & Assert
    await expect(service.generate(BASE_INPUT)).rejects.toThrow(OwnerOperatorNotSupportedError);
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
    // grossRevenue = 2500 + 3000 = 5500
    // dispatchFeeTotal = 250 + 300 = 550
    // accessorialsTotal = 100 + 50 = 150
    // expensesTotal = 150 + 200 = 350
    // netEarnings = 5500 - 550 + 150 - 350 = 4750
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
    expect(createArg.dispatchFeeTotal).toBe(550);
    expect(createArg.expensesTotal).toBe(350);
    expect(createArg.netEarnings).toBe(4750);
    expect(createArg.totalMiles).toBe(1100);
  });
});
