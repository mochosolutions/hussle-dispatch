import { createSettlementService } from '../settlementService';
import { InvalidTransitionError, NotFoundError } from '../../../shared/errors/commonErrors';

const makeSettlement = (overrides: Record<string, unknown> = {}) => ({
  id: 'sett-1',
  organizationId: 'org-1',
  settlementNumber: 'SETT-20260401-0001',
  carrierId: 'carrier-1',
  driverId: 'driver-1',
  vehicleId: 'vehicle-1',
  status: 'DRAFT',
  periodStart: new Date('2026-03-01'),
  periodEnd: new Date('2026-03-31'),
  grossRevenue: 5000,
  totalMiles: 1200,
  dispatchFeeTotal: 500,
  expensesTotal: 200,
  netEarnings: 4300,
  approvedAt: null,
  approvedByUserId: null,
  paidAt: null,
  paymentMethod: null,
  paymentReference: null,
  disputeReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lineItems: [],
  carrier: { id: 'carrier-1', name: 'Test Carrier' },
  driver: null,
  vehicle: null,
  ...overrides,
});

const makeDeps = () => ({
  settlementRepo: {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    findOverlapping: jest.fn(),
    addLineItem: jest.fn(),
    updateLineItem: jest.fn(),
    deleteLineItem: jest.fn(),
    removeLineItem: jest.fn(),
    recalculateTotals: jest.fn(),
  },
  loadQuery: {
    findDeliveredLoads: jest.fn(),
  },
  expenseQuery: {
    findExpenses: jest.fn(),
  },
  carrierQuery: {
    findById: jest.fn(),
  },
  driverQuery: {
    findById: jest.fn(),
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
});

describe('settlementService.approve', () => {
  beforeEach(() => jest.clearAllMocks());

  it('transitions DRAFT to APPROVED', async () => {
    const deps = makeDeps();
    const settlement = makeSettlement({ status: 'DRAFT' });
    const updated = makeSettlement({ status: 'APPROVED', approvedAt: expect.any(Date) });
    deps.settlementRepo.findById.mockResolvedValue(settlement);
    deps.settlementRepo.update.mockResolvedValue(updated);

    const service = createSettlementService(deps);
    const result = await service.approve({
      organizationId: 'org-1',
      settlementId: 'sett-1',
      userId: 'user-1',
    });

    expect(deps.settlementRepo.update).toHaveBeenCalledWith('sett-1', 'org-1', {
      status: 'APPROVED',
      approvedAt: expect.any(Date),
      approvedByUserId: 'user-1',
    });
    expect(result.status).toBe('APPROVED');
  });

  it('transitions DISPUTED to APPROVED', async () => {
    const deps = makeDeps();
    const settlement = makeSettlement({ status: 'DISPUTED' });
    const updated = makeSettlement({ status: 'APPROVED' });
    deps.settlementRepo.findById.mockResolvedValue(settlement);
    deps.settlementRepo.update.mockResolvedValue(updated);

    const service = createSettlementService(deps);
    const result = await service.approve({
      organizationId: 'org-1',
      settlementId: 'sett-1',
      userId: 'user-1',
    });

    expect(deps.settlementRepo.update).toHaveBeenCalledWith('sett-1', 'org-1', {
      status: 'APPROVED',
      approvedAt: expect.any(Date),
      approvedByUserId: 'user-1',
    });
    expect(result.status).toBe('APPROVED');
  });

  it('throws NotFoundError when settlement not found', async () => {
    const deps = makeDeps();
    deps.settlementRepo.findById.mockResolvedValue(null);

    const service = createSettlementService(deps);

    await expect(
      service.approve({
        organizationId: 'org-1',
        settlementId: 'sett-999',
        userId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws InvalidTransitionError when status is PAID', async () => {
    const deps = makeDeps();
    deps.settlementRepo.findById.mockResolvedValue(makeSettlement({ status: 'PAID' }));

    const service = createSettlementService(deps);

    await expect(
      service.approve({
        organizationId: 'org-1',
        settlementId: 'sett-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow(InvalidTransitionError);
  });

  it('throws InvalidTransitionError when status is APPROVED', async () => {
    const deps = makeDeps();
    deps.settlementRepo.findById.mockResolvedValue(makeSettlement({ status: 'APPROVED' }));

    const service = createSettlementService(deps);

    await expect(
      service.approve({
        organizationId: 'org-1',
        settlementId: 'sett-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow(InvalidTransitionError);
  });
});

describe('settlementService.pay', () => {
  beforeEach(() => jest.clearAllMocks());

  it('transitions APPROVED to PAID', async () => {
    const deps = makeDeps();
    const settlement = makeSettlement({ status: 'APPROVED' });
    const updated = makeSettlement({ status: 'PAID', paidAt: new Date() });
    deps.settlementRepo.findById.mockResolvedValue(settlement);
    deps.settlementRepo.update.mockResolvedValue(updated);

    const service = createSettlementService(deps);
    const result = await service.pay({
      organizationId: 'org-1',
      settlementId: 'sett-1',
      paymentMethod: 'ACH',
      paymentReference: 'REF-001',
    });

    expect(deps.settlementRepo.update).toHaveBeenCalledWith('sett-1', 'org-1', {
      status: 'PAID',
      paidAt: expect.any(Date),
      paymentMethod: 'ACH',
      paymentReference: 'REF-001',
    });
    expect(result.status).toBe('PAID');
  });

  it('throws NotFoundError when settlement not found', async () => {
    const deps = makeDeps();
    deps.settlementRepo.findById.mockResolvedValue(null);

    const service = createSettlementService(deps);

    await expect(
      service.pay({
        organizationId: 'org-1',
        settlementId: 'sett-999',
        paymentMethod: 'ACH',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws InvalidTransitionError when status is DRAFT', async () => {
    const deps = makeDeps();
    deps.settlementRepo.findById.mockResolvedValue(makeSettlement({ status: 'DRAFT' }));

    const service = createSettlementService(deps);

    await expect(
      service.pay({
        organizationId: 'org-1',
        settlementId: 'sett-1',
        paymentMethod: 'ACH',
      }),
    ).rejects.toThrow(InvalidTransitionError);
  });
});

describe('settlementService.dispute', () => {
  beforeEach(() => jest.clearAllMocks());

  it('transitions APPROVED to DISPUTED', async () => {
    const deps = makeDeps();
    const settlement = makeSettlement({ status: 'APPROVED' });
    const updated = makeSettlement({ status: 'DISPUTED', disputeReason: 'Incorrect mileage' });
    deps.settlementRepo.findById.mockResolvedValue(settlement);
    deps.settlementRepo.update.mockResolvedValue(updated);

    const service = createSettlementService(deps);
    const result = await service.dispute({
      organizationId: 'org-1',
      settlementId: 'sett-1',
      disputeReason: 'Incorrect mileage',
    });

    expect(deps.settlementRepo.update).toHaveBeenCalledWith('sett-1', 'org-1', {
      status: 'DISPUTED',
      disputeReason: 'Incorrect mileage',
    });
    expect(result.status).toBe('DISPUTED');
  });

  it('throws NotFoundError when settlement not found', async () => {
    const deps = makeDeps();
    deps.settlementRepo.findById.mockResolvedValue(null);

    const service = createSettlementService(deps);

    await expect(
      service.dispute({
        organizationId: 'org-1',
        settlementId: 'sett-999',
        disputeReason: 'Incorrect mileage',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws InvalidTransitionError when status is DRAFT', async () => {
    const deps = makeDeps();
    deps.settlementRepo.findById.mockResolvedValue(makeSettlement({ status: 'DRAFT' }));

    const service = createSettlementService(deps);

    await expect(
      service.dispute({
        organizationId: 'org-1',
        settlementId: 'sett-1',
        disputeReason: 'Incorrect mileage',
      }),
    ).rejects.toThrow(InvalidTransitionError);
  });
});
