import Decimal from 'decimal.js';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { createRecurringExpenseService } from '../recurringExpenseService';

const buildRecurringExpense = (overrides?: Partial<Record<string, unknown>>) => ({
  id: 'rec-1',
  organizationId: 'org-1',
  vehicleId: 'v-1',
  category: 'INSURANCE',
  label: 'Insurance',
  amount: new Decimal('500.00'),
  frequency: 'MONTHLY',
  dayOfMonth: null,
  isActive: true,
  loanId: null,
  lastGeneratedAt: null,
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
  updatedAt: new Date('2026-04-01T00:00:00.000Z'),
  ...overrides,
});

describe('createRecurringExpenseService', () => {
  const mockRecurringExpenseRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    findActiveByVehicle: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    updateLastGeneratedAt: jest.fn(),
  };

  const mockExpenseRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn().mockReturnValue(Promise.resolve()),
    publishDelayed: jest.fn().mockReturnValue(Promise.resolve()),
    subscribe: jest.fn(),
    close: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const service = createRecurringExpenseService({
    recurringExpenseRepo: mockRecurringExpenseRepo,
    expenseRepo: mockExpenseRepo,
    eventBus: mockEventBus,
    logger: mockLogger,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventBus.publish.mockReturnValue(Promise.resolve());
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('creates recurring expense when input valid', async () => {
      // Arrange
      const created = buildRecurringExpense();
      mockRecurringExpenseRepo.create.mockResolvedValue(created);

      // Act
      const result = await service.create({
        organizationId: 'org-1',
        vehicleId: 'v-1',
        category: 'INSURANCE',
        label: 'Insurance',
        amount: 500,
      });

      // Assert
      expect(result).toEqual(created);
      expect(mockRecurringExpenseRepo.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        vehicleId: 'v-1',
        category: 'INSURANCE',
        label: 'Insurance',
        amount: 500,
      });
    });

    it('propagates ConflictError on duplicate vehicleId+label', async () => {
      // Arrange
      mockRecurringExpenseRepo.create.mockRejectedValue(
        new ConflictError('Recurring expense with this vehicle and label already exists'),
      );

      // Act / Assert
      await expect(
        service.create({
          organizationId: 'org-1',
          vehicleId: 'v-1',
          category: 'INSURANCE',
          label: 'Insurance',
          amount: 500,
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------
  describe('list', () => {
    it('lists active recurring expenses for vehicle', async () => {
      // Arrange
      const entries = [buildRecurringExpense(), buildRecurringExpense({ id: 'rec-2' })];
      mockRecurringExpenseRepo.findMany.mockResolvedValue(entries);

      // Act
      const result = await service.list({ organizationId: 'org-1', vehicleId: 'v-1' });

      // Assert
      expect(result).toEqual(entries);
      expect(mockRecurringExpenseRepo.findMany).toHaveBeenCalledWith({
        organizationId: 'org-1',
        vehicleId: 'v-1',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('updates recurring expense', async () => {
      // Arrange
      const existing = buildRecurringExpense();
      const updated = buildRecurringExpense({ amount: new Decimal('600.00') });
      mockRecurringExpenseRepo.findById.mockResolvedValue(existing);
      mockRecurringExpenseRepo.update.mockResolvedValue(updated);

      // Act
      const result = await service.update({
        id: 'rec-1',
        organizationId: 'org-1',
        amount: 600,
      });

      // Assert
      expect(result).toEqual(updated);
      expect(mockRecurringExpenseRepo.update).toHaveBeenCalledWith('rec-1', { amount: 600 });
    });

    it('throws NotFoundError when recurring expense not found', async () => {
      // Arrange
      mockRecurringExpenseRepo.findById.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.update({ id: 'missing', organizationId: 'org-1', amount: 600 }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------------------------------
  // deactivate
  // ---------------------------------------------------------------------------
  describe('deactivate', () => {
    it('deactivates recurring expense (sets isActive=false)', async () => {
      // Arrange
      const existing = buildRecurringExpense();
      mockRecurringExpenseRepo.findById.mockResolvedValue(existing);
      mockRecurringExpenseRepo.deactivate.mockResolvedValue(
        buildRecurringExpense({ isActive: false }),
      );

      // Act
      await service.deactivate({ id: 'rec-1', organizationId: 'org-1' });

      // Assert
      expect(mockRecurringExpenseRepo.deactivate).toHaveBeenCalledWith('rec-1');
    });

    it('throws NotFoundError when deactivating non-existent', async () => {
      // Arrange
      mockRecurringExpenseRepo.findById.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.deactivate({ id: 'missing', organizationId: 'org-1' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------------------------------
  // generate
  // ---------------------------------------------------------------------------
  describe('generate', () => {
    it('generates expense records from active templates', async () => {
      // Arrange
      const entry1 = buildRecurringExpense({ id: 'rec-1', lastGeneratedAt: null });
      const entry2 = buildRecurringExpense({
        id: 'rec-2',
        category: 'TOLL',
        label: 'Tolls',
        amount: new Decimal('200.00'),
        lastGeneratedAt: null,
      });
      mockRecurringExpenseRepo.findActiveByVehicle.mockResolvedValue([entry1, entry2]);
      mockExpenseRepo.create.mockResolvedValue({});
      mockRecurringExpenseRepo.updateLastGeneratedAt.mockResolvedValue(undefined);

      // Act
      const result = await service.generate({ vehicleId: 'v-1', organizationId: 'org-1' });

      // Assert
      expect(result).toEqual({ generated: 2, skipped: 0 });
      expect(mockExpenseRepo.create).toHaveBeenCalledTimes(2);
      expect(mockExpenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'RECURRING',
          isRecurring: true,
          recurringExpenseId: 'rec-1',
        }),
      );
      expect(mockExpenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'RECURRING',
          isRecurring: true,
          recurringExpenseId: 'rec-2',
        }),
      );
    });

    it('skips already-generated entries (idempotent)', async () => {
      // Arrange — lastGeneratedAt is today (same month), should be skipped
      const now = new Date();
      const entry = buildRecurringExpense({ lastGeneratedAt: now });
      mockRecurringExpenseRepo.findActiveByVehicle.mockResolvedValue([entry]);

      // Act
      const result = await service.generate({ vehicleId: 'v-1', organizationId: 'org-1' });

      // Assert
      expect(result).toEqual({ generated: 0, skipped: 1 });
      expect(mockExpenseRepo.create).not.toHaveBeenCalled();
    });

    it('updates lastGeneratedAt after generation', async () => {
      // Arrange
      const entry = buildRecurringExpense({ lastGeneratedAt: null });
      mockRecurringExpenseRepo.findActiveByVehicle.mockResolvedValue([entry]);
      mockExpenseRepo.create.mockResolvedValue({});
      mockRecurringExpenseRepo.updateLastGeneratedAt.mockResolvedValue(undefined);

      // Act
      await service.generate({ vehicleId: 'v-1', organizationId: 'org-1' });

      // Assert
      expect(mockRecurringExpenseRepo.updateLastGeneratedAt).toHaveBeenCalledWith(
        'rec-1',
        expect.any(Date),
      );
    });

    it('publishes recurring-expense.generated event with count', async () => {
      // Arrange
      const entry = buildRecurringExpense({ lastGeneratedAt: null });
      mockRecurringExpenseRepo.findActiveByVehicle.mockResolvedValue([entry]);
      mockExpenseRepo.create.mockResolvedValue({});
      mockRecurringExpenseRepo.updateLastGeneratedAt.mockResolvedValue(undefined);

      // Act
      await service.generate({ vehicleId: 'v-1', organizationId: 'org-1' });

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('recurring-expense.generated', {
        vehicleId: 'v-1',
        organizationId: 'org-1',
        count: 1,
      });
    });

    it('returns { generated: 0, skipped: 0 } when no active entries exist', async () => {
      // Arrange
      mockRecurringExpenseRepo.findActiveByVehicle.mockResolvedValue([]);

      // Act
      const result = await service.generate({ vehicleId: 'v-1', organizationId: 'org-1' });

      // Assert
      expect(result).toEqual({ generated: 0, skipped: 0 });
      expect(mockExpenseRepo.create).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});
