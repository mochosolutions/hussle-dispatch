import Decimal from 'decimal.js';
import { SettlementItemType } from '@prisma/client';
import { createSettlementAdjustmentService } from '../settlementAdjustmentService';
import { NotFoundError, ValidationError } from '../../../shared/errors/commonErrors';
import type { SettlementRepoPort, SettlementWithRelations } from '../../types/settlementTypes';
import type { Logger } from '../../../shared/utils/logger';

const mockLogger: Logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const createMockSettlement = (
  overrides: Partial<SettlementWithRelations> = {},
): SettlementWithRelations =>
  ({
    id: 'settlement-1',
    organizationId: 'org-1',
    settlementNumber: 'STL-001',
    status: 'DRAFT',
    periodStart: new Date('2026-03-01'),
    periodEnd: new Date('2026-03-15'),
    grossRevenue: 5000,
    dispatchFeeTotal: 500,
    expensesTotal: 200,
    netEarnings: 4300,
    totalMiles: 1200,
    carrierId: 'carrier-1',
    driverId: 'driver-1',
    vehicleId: 'vehicle-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    approvedAt: null,
    approvedByUserId: null,
    paidAt: null,
    paymentMethod: null,
    paymentReference: null,
    disputeReason: null,
    sentAt: null,
    sentToEmail: null,
    carrier: { id: 'carrier-1', name: 'Test Carrier' } as SettlementWithRelations['carrier'],
    driver: null,
    vehicle: null,
    lineItems: [
      {
        id: 'li-adj-1',
        settlementId: 'settlement-1',
        type: SettlementItemType.ADJUSTMENT,
        description: 'Bonus',
        amount: new Decimal('100'),
        date: new Date('2026-03-10'),
        referenceId: null,
        miles: null,
        createdAt: new Date(),
      },
      {
        id: 'li-load-1',
        settlementId: 'settlement-1',
        type: SettlementItemType.LOAD_REVENUE,
        description: 'Load #123',
        amount: new Decimal('2000'),
        date: new Date('2026-03-05'),
        referenceId: 'load-1',
        miles: 400,
        createdAt: new Date(),
      },
    ],
    ...overrides,
  }) as SettlementWithRelations;

const createMockRepo = (): jest.Mocked<
  Pick<
    SettlementRepoPort,
    'findById' | 'addLineItem' | 'updateLineItem' | 'deleteLineItem' | 'recalculateTotals'
  >
> => ({
  findById: jest.fn(),
  addLineItem: jest.fn(),
  updateLineItem: jest.fn(),
  deleteLineItem: jest.fn(),
  recalculateTotals: jest.fn(),
});

describe('settlementAdjustmentService', () => {
  const setup = () => {
    const mockRepo = createMockRepo();
    const service = createSettlementAdjustmentService({
      settlementRepo: mockRepo as unknown as SettlementRepoPort,
      logger: mockLogger,
    });
    return { mockRepo, service };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // addAdjustment
  // ---------------------------------------------------------------------------
  describe('addAdjustment', () => {
    const baseInput = {
      organizationId: 'org-1',
      settlementId: 'settlement-1',
      description: 'Fuel reimbursement',
      amount: 150,
      date: new Date('2026-03-12'),
    };

    it('adds ADJUSTMENT line item to DRAFT settlement', async () => {
      const { mockRepo, service } = setup();
      const settlement = createMockSettlement();
      const updated = createMockSettlement();

      mockRepo.findById.mockResolvedValue(settlement);
      mockRepo.addLineItem.mockResolvedValue({
        id: 'li-new',
        settlementId: 'settlement-1',
        type: SettlementItemType.ADJUSTMENT,
        description: baseInput.description,
        amount: new Decimal(baseInput.amount),
        date: baseInput.date,
        referenceId: null,
        miles: null,
        createdAt: new Date(),
      });
      mockRepo.recalculateTotals.mockResolvedValue(updated);

      const result = await service.addAdjustment(baseInput);

      expect(mockRepo.addLineItem).toHaveBeenCalledWith({
        settlementId: 'settlement-1',
        type: 'ADJUSTMENT',
        description: baseInput.description,
        amount: baseInput.amount,
        date: baseInput.date,
      });
      expect(mockRepo.recalculateTotals).toHaveBeenCalledWith('settlement-1');
      expect(result).toBe(updated);
    });

    it('throws NotFoundError when settlement not found', async () => {
      const { mockRepo, service } = setup();
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.addAdjustment(baseInput)).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when settlement is APPROVED', async () => {
      const { mockRepo, service } = setup();
      mockRepo.findById.mockResolvedValue(createMockSettlement({ status: 'APPROVED' }));

      await expect(service.addAdjustment(baseInput)).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when settlement is PAID', async () => {
      const { mockRepo, service } = setup();
      mockRepo.findById.mockResolvedValue(createMockSettlement({ status: 'PAID' }));

      await expect(service.addAdjustment(baseInput)).rejects.toThrow(ValidationError);
    });
  });

  // ---------------------------------------------------------------------------
  // updateAdjustment
  // ---------------------------------------------------------------------------
  describe('updateAdjustment', () => {
    const baseInput = {
      organizationId: 'org-1',
      settlementId: 'settlement-1',
      lineItemId: 'li-adj-1',
      description: 'Updated bonus',
      amount: 200,
    };

    it('updates ADJUSTMENT line item', async () => {
      const { mockRepo, service } = setup();
      const settlement = createMockSettlement();
      const updated = createMockSettlement();

      mockRepo.findById.mockResolvedValue(settlement);
      mockRepo.updateLineItem.mockResolvedValue({
        id: 'li-adj-1',
        settlementId: 'settlement-1',
        type: SettlementItemType.ADJUSTMENT,
        description: 'Updated bonus',
        amount: new Decimal('200'),
        date: new Date('2026-03-10'),
        referenceId: null,
        miles: null,
        createdAt: new Date(),
      });
      mockRepo.recalculateTotals.mockResolvedValue(updated);

      const result = await service.updateAdjustment(baseInput);

      expect(mockRepo.updateLineItem).toHaveBeenCalledWith('li-adj-1', {
        description: 'Updated bonus',
        amount: 200,
      });
      expect(mockRepo.recalculateTotals).toHaveBeenCalledWith('settlement-1');
      expect(result).toBe(updated);
    });

    it('throws NotFoundError when settlement not found', async () => {
      const { mockRepo, service } = setup();
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.updateAdjustment(baseInput)).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when not DRAFT', async () => {
      const { mockRepo, service } = setup();
      mockRepo.findById.mockResolvedValue(createMockSettlement({ status: 'APPROVED' }));

      await expect(service.updateAdjustment(baseInput)).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError when line item not found', async () => {
      const { mockRepo, service } = setup();
      mockRepo.findById.mockResolvedValue(createMockSettlement());

      await expect(
        service.updateAdjustment({ ...baseInput, lineItemId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when line item is not ADJUSTMENT', async () => {
      const { mockRepo, service } = setup();
      mockRepo.findById.mockResolvedValue(createMockSettlement());

      await expect(
        service.updateAdjustment({ ...baseInput, lineItemId: 'li-load-1' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteAdjustment
  // ---------------------------------------------------------------------------
  describe('deleteAdjustment', () => {
    const baseInput = {
      organizationId: 'org-1',
      settlementId: 'settlement-1',
      lineItemId: 'li-adj-1',
    };

    it('deletes ADJUSTMENT line item', async () => {
      const { mockRepo, service } = setup();
      const settlement = createMockSettlement();
      const updated = createMockSettlement();

      mockRepo.findById.mockResolvedValue(settlement);
      mockRepo.deleteLineItem.mockResolvedValue(undefined);
      mockRepo.recalculateTotals.mockResolvedValue(updated);

      const result = await service.deleteAdjustment(baseInput);

      expect(mockRepo.deleteLineItem).toHaveBeenCalledWith('li-adj-1');
      expect(mockRepo.recalculateTotals).toHaveBeenCalledWith('settlement-1');
      expect(result).toBe(updated);
    });

    it('throws NotFoundError when settlement not found', async () => {
      const { mockRepo, service } = setup();
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.deleteAdjustment(baseInput)).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when not DRAFT', async () => {
      const { mockRepo, service } = setup();
      mockRepo.findById.mockResolvedValue(createMockSettlement({ status: 'PAID' }));

      await expect(service.deleteAdjustment(baseInput)).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when line item is not ADJUSTMENT', async () => {
      const { mockRepo, service } = setup();
      mockRepo.findById.mockResolvedValue(createMockSettlement());

      await expect(
        service.deleteAdjustment({ ...baseInput, lineItemId: 'li-load-1' }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
