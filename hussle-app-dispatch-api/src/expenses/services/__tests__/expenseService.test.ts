import Decimal from 'decimal.js';
import { NotFoundError, ValidationError } from '@/shared/errors';
import { createExpenseService } from '../expenseService';

const buildExpense = (overrides?: Partial<Record<string, unknown>>) => ({
  id: 'exp-1',
  organizationId: 'org-1',
  vehicleId: 'veh-1',
  driverId: null,
  category: 'MAINTENANCE',
  vendor: 'AutoZone',
  amount: new Decimal('150.00'),
  date: new Date('2026-04-01'),
  state: null,
  notes: null,
  gallons: null,
  pricePerGallon: null,
  fuelType: null,
  odometer: null,
  source: 'MANUAL',
  receiptUrl: null,
  isRecurring: false,
  recurringExpenseId: null,
  externalTransactionId: null,
  deletedAt: null,
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
  updatedAt: new Date('2026-04-01T00:00:00.000Z'),
  ...overrides,
});

const buildFuelExpense = (overrides?: Partial<Record<string, unknown>>) =>
  buildExpense({
    category: 'FUEL',
    amount: new Decimal('100.00'),
    gallons: new Decimal('25.00'),
    pricePerGallon: new Decimal('4.00'),
    fuelType: 'DIESEL',
    state: 'TX',
    ...overrides,
  });

describe('createExpenseService', () => {
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
    subscribe: jest.fn(),
    close: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const service = createExpenseService({
    expenseRepo: mockExpenseRepo,
    eventBus: mockEventBus,
    logger: mockLogger,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventBus.publish.mockReturnValue(Promise.resolve());
  });

  // ---------------------------------------------------------------------------
  // createExpense
  // ---------------------------------------------------------------------------
  describe('createExpense', () => {
    it('creates expense when input valid (non-fuel)', async () => {
      // Arrange
      const created = buildExpense();
      mockExpenseRepo.create.mockResolvedValue(created);

      // Act
      const result = await service.createExpense({
        organizationId: 'org-1',
        vehicleId: 'veh-1',
        category: 'MAINTENANCE',
        amount: 150,
        date: new Date('2026-04-01'),
      });

      // Assert
      expect(result).toEqual(created);
      expect(mockExpenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          vehicleId: 'veh-1',
          category: 'MAINTENANCE',
          amount: 150,
        }),
      );
    });

    it('creates fuel expense: amount + gallons derives pricePerGallon', async () => {
      // Arrange
      const created = buildFuelExpense();
      mockExpenseRepo.create.mockResolvedValue(created);

      // Act
      await service.createExpense({
        organizationId: 'org-1',
        vehicleId: 'veh-1',
        category: 'FUEL',
        amount: 100,
        gallons: 25,
        state: 'TX',
        date: new Date('2026-04-01'),
      });

      // Assert
      expect(mockExpenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          gallons: 25,
          pricePerGallon: 4,
        }),
      );
    });

    it('creates fuel expense: gallons + pricePerGallon derives amount', async () => {
      // Arrange
      const created = buildFuelExpense();
      mockExpenseRepo.create.mockResolvedValue(created);

      // Act
      await service.createExpense({
        organizationId: 'org-1',
        vehicleId: 'veh-1',
        category: 'FUEL',
        gallons: 25,
        pricePerGallon: 4,
        state: 'TX',
        date: new Date('2026-04-01'),
      });

      // Assert
      expect(mockExpenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          gallons: 25,
          pricePerGallon: 4,
        }),
      );
    });

    it('creates fuel expense: amount + pricePerGallon derives gallons', async () => {
      // Arrange
      const created = buildFuelExpense();
      mockExpenseRepo.create.mockResolvedValue(created);

      // Act
      await service.createExpense({
        organizationId: 'org-1',
        vehicleId: 'veh-1',
        category: 'FUEL',
        amount: 100,
        pricePerGallon: 4,
        state: 'TX',
        date: new Date('2026-04-01'),
      });

      // Assert
      expect(mockExpenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          gallons: 25,
          pricePerGallon: 4,
        }),
      );
    });

    it('throws ValidationError when fuel expense missing 2-of-3 fields', async () => {
      // Arrange / Act / Assert
      await expect(
        service.createExpense({
          organizationId: 'org-1',
          vehicleId: 'veh-1',
          category: 'FUEL',
          amount: 100,
          state: 'TX',
          date: new Date('2026-04-01'),
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when fuel expense missing state', async () => {
      // Arrange / Act / Assert
      await expect(
        service.createExpense({
          organizationId: 'org-1',
          vehicleId: 'veh-1',
          category: 'FUEL',
          amount: 100,
          gallons: 25,
          date: new Date('2026-04-01'),
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('defaults fuelType to DIESEL when category FUEL and fuelType not provided', async () => {
      // Arrange
      const created = buildFuelExpense();
      mockExpenseRepo.create.mockResolvedValue(created);

      // Act
      await service.createExpense({
        organizationId: 'org-1',
        vehicleId: 'veh-1',
        category: 'FUEL',
        amount: 100,
        gallons: 25,
        state: 'TX',
        date: new Date('2026-04-01'),
      });

      // Assert
      expect(mockExpenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fuelType: 'DIESEL',
        }),
      );
    });

    it('rejects fuel-specific fields on non-fuel expense', async () => {
      // Arrange / Act / Assert
      await expect(
        service.createExpense({
          organizationId: 'org-1',
          vehicleId: 'veh-1',
          category: 'MAINTENANCE',
          amount: 50,
          gallons: 10,
          date: new Date('2026-04-01'),
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when non-fuel expense missing amount', async () => {
      // Arrange / Act / Assert
      await expect(
        service.createExpense({
          organizationId: 'org-1',
          vehicleId: 'veh-1',
          category: 'MAINTENANCE',
          date: new Date('2026-04-01'),
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('publishes expense.created event on create', async () => {
      // Arrange
      const created = buildExpense();
      mockExpenseRepo.create.mockResolvedValue(created);

      // Act
      await service.createExpense({
        organizationId: 'org-1',
        vehicleId: 'veh-1',
        category: 'MAINTENANCE',
        amount: 150,
        date: new Date('2026-04-01'),
      });

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('expense.created', {
        expenseId: 'exp-1',
        vehicleId: 'veh-1',
        organizationId: 'org-1',
        category: 'MAINTENANCE',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getExpenseById
  // ---------------------------------------------------------------------------
  describe('getExpenseById', () => {
    it('throws NotFoundError when getting non-existent expense', async () => {
      // Arrange
      mockExpenseRepo.findById.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.getExpenseById({ id: 'missing', organizationId: 'org-1' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------------------------------
  // updateExpense
  // ---------------------------------------------------------------------------
  describe('updateExpense', () => {
    it('publishes expense.updated event on update', async () => {
      // Arrange
      const existing = buildExpense();
      const updated = buildExpense({ vendor: 'NewVendor' });
      mockExpenseRepo.findById.mockResolvedValue(existing);
      mockExpenseRepo.update.mockResolvedValue(updated);

      // Act
      await service.updateExpense({
        id: 'exp-1',
        organizationId: 'org-1',
        vendor: 'NewVendor',
      });

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('expense.updated', {
        expenseId: 'exp-1',
        vehicleId: 'veh-1',
        organizationId: 'org-1',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // softDeleteExpense
  // ---------------------------------------------------------------------------
  describe('softDeleteExpense', () => {
    it('soft-deletes expense and publishes event', async () => {
      // Arrange
      const existing = buildExpense();
      const deleted = buildExpense({ deletedAt: new Date() });
      mockExpenseRepo.findById.mockResolvedValue(existing);
      mockExpenseRepo.softDelete.mockResolvedValue(deleted);

      // Act
      await service.softDeleteExpense({ id: 'exp-1', organizationId: 'org-1' });

      // Assert
      expect(mockExpenseRepo.softDelete).toHaveBeenCalledWith('exp-1');
      expect(mockEventBus.publish).toHaveBeenCalledWith('expense.deleted', {
        expenseId: 'exp-1',
        vehicleId: 'veh-1',
        organizationId: 'org-1',
      });
    });

    it('throws NotFoundError when soft-deleting non-existent expense', async () => {
      // Arrange
      mockExpenseRepo.findById.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.softDeleteExpense({ id: 'missing', organizationId: 'org-1' }),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
