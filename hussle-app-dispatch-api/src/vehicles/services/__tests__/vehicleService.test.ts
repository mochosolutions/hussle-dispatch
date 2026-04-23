import Decimal from 'decimal.js';
import {
  ActiveLoadsConflictError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  SeatLimitReachedError,
  ValidationError,
} from '@/shared/errors';
import { createVehicleService } from '../vehicleService';

const buildVehicle = () => ({
  id: '4f83f8d0-0f18-4f7a-95f1-85c293f23f70',
  carrierId: '5d153f6d-d8e6-4928-8f9b-652f20e9a8b2',
  driverId: null as string | null,
  unitNumber: 'TRK-001',
  type: 'DRY_VAN',
  ownership: 'OWNED',
  year: 2021,
  make: 'Freightliner',
  model: 'Cascadia',
  vin: '1FUJGLDR3AS123456',
  licensePlate: 'ABC1234',
  licensePlateState: 'TX',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '555-555-9090',
  warrantyInfo: 'powertrain',
  monthlyGrossTarget: new Decimal('18000.00'),
  monthlyMilesTarget: 9000,
  workingDaysPerMonth: 22,
  isActive: true,
  notes: null,
  createdAt: new Date('2026-03-01T00:00:00.000Z'),
  updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  deletedAt: null,
  expenses: [
    {
      id: 'ab66be57-c6f3-4ec4-a9c5-f6988988d83f',
      vehicleId: '4f83f8d0-0f18-4f7a-95f1-85c293f23f70',
      category: 'INSURANCE',
      expenseKey: 'insurance',
      label: 'Insurance',
      monthlyAmount: new Decimal('300.00'),
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    },
  ],
});

const buildDriver = (
  overrides?: Partial<{ id: string; carrierId: string; isAvailable: boolean }>,
) => ({
  id: overrides?.id ?? 'driver-1',
  carrierId: overrides?.carrierId ?? '5d153f6d-d8e6-4928-8f9b-652f20e9a8b2',
  isAvailable: overrides?.isAvailable ?? true,
});

describe('vehicleService', () => {
  const mockVehicleRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    replaceExpenses: jest.fn(),
    createExpense: jest.fn(),
    findExpensesByVehicleId: jest.fn(),
    softDelete: jest.fn(),
    assignDriver: jest.fn(),
    unassignDriver: jest.fn(),
    findByDriverId: jest.fn(),
    countActiveByOrganization: jest.fn(),
  };

  const mockCarrierRepository = {
    findActiveByIdForOrg: jest.fn(),
  };

  const mockLoadRepository = {
    findBlockingLoadIdsByDriver: jest.fn(),
    findBlockingLoadIdsByVehicle: jest.fn(),
    countActiveByVehicleIds: jest.fn(),
  };

  const mockDriverQueryPort = {
    findById: jest.fn(),
  };

  const mockLoadQueryPort = {
    getLoadsByDriverId: jest.fn(),
    getLoadsByVehicleId: jest.fn(),
  };

  const mockTransactionManager = {
    runInTransaction: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn().mockResolvedValue(undefined),
    publishDelayed: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const vehicleService = createVehicleService({
    vehicleRepository: mockVehicleRepository,
    carrierRepository: mockCarrierRepository,
    loadRepository: mockLoadRepository,
    driverQueryPort: mockDriverQueryPort,
    loadQueryPort: mockLoadQueryPort,
    transactionManager: mockTransactionManager,
    vehicleRepositoryFactory: () => mockVehicleRepository,
    eventBus: mockEventBus,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadRepository.findBlockingLoadIdsByDriver.mockResolvedValue([]);
    mockLoadRepository.findBlockingLoadIdsByVehicle.mockResolvedValue([]);
    mockLoadRepository.countActiveByVehicleIds.mockResolvedValue(new Map());
  });

  it('blocks owner_operator role from creating vehicles', async () => {
    await expect(
      vehicleService.createVehicle({
        organizationId: 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad',
        role: 'owner_operator',
        input: {
          carrierId: '5d153f6d-d8e6-4928-8f9b-652f20e9a8b2',
          unitNumber: 'TRK-001',
          type: 'DRY_VAN',
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws SeatLimitReachedError when vehicle limit is reached', async () => {
    mockCarrierRepository.findActiveByIdForOrg.mockResolvedValue(true);
    mockVehicleRepository.countActiveByOrganization.mockResolvedValue(3);

    await expect(
      vehicleService.createVehicle({
        organizationId: 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad',
        role: 'admin',
        input: {
          carrierId: '5d153f6d-d8e6-4928-8f9b-652f20e9a8b2',
          unitNumber: 'TRK-001',
          type: 'DRY_VAN',
        },
      }),
    ).rejects.toBeInstanceOf(SeatLimitReachedError);

    expect(mockVehicleRepository.create).not.toHaveBeenCalled();
  });

  it('returns not found when carrier does not exist on create', async () => {
    mockCarrierRepository.findActiveByIdForOrg.mockResolvedValue(false);

    await expect(
      vehicleService.createVehicle({
        organizationId: 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad',
        role: 'admin',
        input: {
          carrierId: '5d153f6d-d8e6-4928-8f9b-652f20e9a8b2',
          unitNumber: 'TRK-001',
          type: 'DRY_VAN',
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects update when duplicate expense keys are provided', async () => {
    mockVehicleRepository.findById.mockResolvedValue(buildVehicle());

    await expect(
      vehicleService.updateVehicle({
        id: '4f83f8d0-0f18-4f7a-95f1-85c293f23f70',
        organizationId: 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad',
        role: 'admin',
        input: {
          expenses: [
            {
              category: 'INSURANCE',
              expenseKey: 'insurance',
              label: 'Insurance #1',
              monthlyAmount: 100,
            },
            {
              category: 'FUEL',
              expenseKey: 'insurance',
              label: 'Insurance #2',
              monthlyAmount: 120,
            },
          ],
        },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('replaces expenses in transaction when expenses are provided', async () => {
    const updatedVehicle = buildVehicle();
    mockVehicleRepository.findById
      .mockResolvedValueOnce(buildVehicle())
      .mockResolvedValueOnce(updatedVehicle);

    mockTransactionManager.runInTransaction.mockImplementation(async (operation) => operation({}));

    const result = await vehicleService.updateVehicle({
      id: '4f83f8d0-0f18-4f7a-95f1-85c293f23f70',
      organizationId: 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad',
      role: 'admin',
      input: {
        unitNumber: 'TRK-009',
        expenses: [
          {
            category: 'INSURANCE',
            expenseKey: 'insurance',
            label: 'Insurance',
            monthlyAmount: 350,
          },
        ],
      },
    });

    expect(mockVehicleRepository.update).toHaveBeenCalledWith(
      '4f83f8d0-0f18-4f7a-95f1-85c293f23f70',
      'f370736f-8d57-47f7-9d7d-a5d6f7a59dad',
      expect.objectContaining({
        unitNumber: 'TRK-009',
      }),
    );
    expect(mockVehicleRepository.replaceExpenses).toHaveBeenCalledWith(
      '4f83f8d0-0f18-4f7a-95f1-85c293f23f70',
      expect.any(Array),
    );
    expect(result.unitNumber).toBe('TRK-001');
  });

  it('blocks soft-delete when loads are active before delivered', async () => {
    mockVehicleRepository.findById.mockResolvedValue(buildVehicle());
    mockLoadRepository.findBlockingLoadIdsByVehicle.mockResolvedValue(['load-1', 'load-2']);

    await expect(
      vehicleService.deleteVehicle({
        id: '4f83f8d0-0f18-4f7a-95f1-85c293f23f70',
        organizationId: 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad',
        role: 'admin',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('atomically switches a driver from another idle vehicle', async () => {
    const targetVehicle = {
      ...buildVehicle(),
      id: 'target-vehicle',
      driverId: null,
      unitNumber: 'TRK-009',
    };
    const currentVehicle = {
      ...buildVehicle(),
      id: 'current-vehicle',
      driverId: 'driver-1',
      unitNumber: 'TRK-002',
    };

    mockVehicleRepository.findById.mockResolvedValue(targetVehicle);
    mockDriverQueryPort.findById.mockResolvedValue(buildDriver());
    mockVehicleRepository.findByDriverId.mockResolvedValue(currentVehicle);
    mockTransactionManager.runInTransaction.mockImplementation(async (operation) => operation({}));
    mockVehicleRepository.assignDriver.mockResolvedValue({
      ...targetVehicle,
      driverId: 'driver-1',
    });

    const result = await vehicleService.assignDriver({
      id: 'target-vehicle',
      organizationId: 'org-1',
      role: 'admin',
      driverId: 'driver-1',
    });

    expect(mockVehicleRepository.unassignDriver).toHaveBeenCalledWith('current-vehicle');
    expect(mockVehicleRepository.assignDriver).toHaveBeenCalledWith('target-vehicle', 'driver-1');
    expect(result.driverId).toBe('driver-1');
  });

  it('blocks driver reassignment when active loads exist on an affected asset', async () => {
    mockVehicleRepository.findById.mockResolvedValue(buildVehicle());
    mockDriverQueryPort.findById.mockResolvedValue(buildDriver());
    mockVehicleRepository.findByDriverId.mockResolvedValue({
      ...buildVehicle(),
      id: 'existing-vehicle',
      driverId: 'driver-1',
    });
    mockLoadRepository.findBlockingLoadIdsByVehicle.mockResolvedValue(['load-77']);

    await expect(
      vehicleService.assignDriver({
        id: '4f83f8d0-0f18-4f7a-95f1-85c293f23f70',
        organizationId: 'org-1',
        role: 'admin',
        driverId: 'driver-1',
      }),
    ).rejects.toBeInstanceOf(ActiveLoadsConflictError);
  });

  it('blocks unassigning a driver when active loads exist', async () => {
    mockVehicleRepository.findById.mockResolvedValue({
      ...buildVehicle(),
      driverId: 'driver-1',
    });
    mockLoadRepository.findBlockingLoadIdsByDriver.mockResolvedValue(['load-12']);

    await expect(
      vehicleService.unassignDriver({
        id: '4f83f8d0-0f18-4f7a-95f1-85c293f23f70',
        organizationId: 'org-1',
        role: 'admin',
      }),
    ).rejects.toBeInstanceOf(ActiveLoadsConflictError);
  });

  describe('expense event emissions', () => {
    it('emits vehicle.expense.changed when updateVehicle includes expenses', async () => {
      // Arrange
      const vehicleId = '4f83f8d0-0f18-4f7a-95f1-85c293f23f70';
      const organizationId = 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad';
      const updatedVehicle = buildVehicle();

      mockVehicleRepository.findById
        .mockResolvedValueOnce(buildVehicle())
        .mockResolvedValueOnce(updatedVehicle);
      mockTransactionManager.runInTransaction.mockImplementation(async (operation) =>
        operation({}),
      );

      // Act
      await vehicleService.updateVehicle({
        id: vehicleId,
        organizationId,
        role: 'admin',
        input: {
          expenses: [
            {
              category: 'INSURANCE',
              expenseKey: 'insurance',
              label: 'Insurance',
              monthlyAmount: 350,
            },
          ],
        },
      });

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('vehicle.expense.changed', {
        vehicleId,
        organizationId,
      });
    });

    it('does not emit vehicle.expense.changed when updateVehicle has no expenses', async () => {
      // Arrange
      const vehicleId = '4f83f8d0-0f18-4f7a-95f1-85c293f23f70';
      const organizationId = 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad';
      const updatedVehicle = buildVehicle();

      mockVehicleRepository.findById.mockResolvedValue(updatedVehicle);
      mockVehicleRepository.update.mockResolvedValue(updatedVehicle);

      // Act
      await vehicleService.updateVehicle({
        id: vehicleId,
        organizationId,
        role: 'admin',
        input: {
          unitNumber: 'TRK-099',
        },
      });

      // Assert
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('emits vehicle.expense.created when createExpense succeeds', async () => {
      // Arrange
      const vehicleId = '4f83f8d0-0f18-4f7a-95f1-85c293f23f70';
      const organizationId = 'f370736f-8d57-47f7-9d7d-a5d6f7a59dad';
      const expenseId = 'expense-new-001';

      mockVehicleRepository.findById.mockResolvedValue(buildVehicle());
      mockVehicleRepository.createExpense.mockResolvedValue({
        id: expenseId,
        vehicleId,
        category: 'FUEL',
        expenseKey: 'fuel',
        label: 'Fuel',
        monthlyAmount: new Decimal('500.00'),
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      });

      // Act
      await vehicleService.createExpense({
        vehicleId,
        organizationId,
        role: 'admin',
        input: {
          category: 'FUEL',
          expenseKey: 'fuel',
          label: 'Fuel',
          monthlyAmount: 500,
        },
      });

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith('vehicle.expense.created', {
        vehicleId,
        organizationId,
        expenseId,
      });
    });
  });
});
