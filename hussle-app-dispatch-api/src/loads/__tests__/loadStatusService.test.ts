import { createLoadStatusService } from '../services/loadStatusService';
import type { LoadStatusService } from '../services/loadStatusService';
import type { LoadRepoPort, LoadWithRelations } from '../types/loadTypes';
import type { LoadStatusRepoPort } from '../types/loadStatusTypes';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { NotFoundError, InvalidTransitionError, ForbiddenError, ValidationError } from '@/shared/errors';

const createMockLoad = (overrides: Partial<LoadWithRelations> = {}): LoadWithRelations => ({
  id: 'load-1',
  organizationId: 'org-1',
  loadNumber: 'L-001',
  status: 'QUOTED',
  carrierId: null,
  driverId: null,
  vehicleId: null,
  contactId: null,
  externalRefNumber: null,
  equipmentType: null,
  isHazmat: false,
  isTarp: false,
  isTeamDriver: false,
  commodity: null,
  weight: null,
  pieceCount: null,
  loadedMiles: null,
  deadheadMiles: null,
  totalMiles: null,
  customerRate: null,
  carrierRate: null,
  // US-14: persisted financial output cache columns removed — derived on read.
  dispatchFeeType: null,
  dispatchFeeAmount: null,
  estimatedHours: null,
  dispatcherUserId: null,
  version: 0,
  rateConReceivedAt: null,
  bolUnsignedAt: null,
  bolSignedAt: null,
  dispatcherNotes: null,
  driverInstructions: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  stops: [],
  carrier: null,
  driver: null,
  vehicle: null,
  contact: null,
  statusHistory: [],
  checkCalls: [],
  accessorialCharges: [],
  ...overrides,
} as LoadWithRelations);

const createMockDeps = () => {
  const loadRepository: jest.Mocked<LoadRepoPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdUnscoped: jest.fn(),
    list: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createCheckCall: jest.fn(),
    listCheckCalls: jest.fn(),
    listStatusHistory: jest.fn(),
    listDocuments: jest.fn(),
    findBlockingLoadIdsByDriver: jest.fn(),
    findBlockingLoadIdsByVehicle: jest.fn(),
    findLastDeliveryCoordinates: jest.fn(),
    findFirstPickupCoordinates: jest.fn(),
  };

  const loadStatusRepo: jest.Mocked<LoadStatusRepoPort> = {
    updateStatus: jest.fn(),
    createStatusHistory: jest.fn(),
    createAccessorialCharge: jest.fn(),
    sumAccessorialCharges: jest.fn().mockResolvedValue('0'),
    updateFinancials: jest.fn(),
  };

  const eventBus: jest.Mocked<EventBus> = {
    publish: jest.fn().mockResolvedValue(undefined),
    publishDelayed: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return { loadRepository, loadStatusRepo, eventBus, logger };
};

describe('loadStatusService', () => {
  let service: LoadStatusService;
  let deps: ReturnType<typeof createMockDeps>;

  beforeEach(() => {
    deps = createMockDeps();
    service = createLoadStatusService(deps);
  });

  describe('transitionStatus', () => {
    it('transitions from QUOTED to BOOKED when carrier is assigned', async () => {
      const load = createMockLoad({ status: 'QUOTED', carrierId: 'carrier-1' });
      deps.loadRepository.findById.mockResolvedValue(load);
      deps.loadStatusRepo.updateStatus.mockResolvedValue(
        createMockLoad({ status: 'BOOKED', carrierId: 'carrier-1' }),
      );

      const result = await service.transitionStatus({
        loadId: 'load-1',
        organizationId: 'org-1',
        targetStatus: 'BOOKED',
        userId: 'user-1',
        userRole: 'admin',
      });

      expect(result.success).toBe(true);
      expect(result.load?.status).toBe('BOOKED');
      expect(deps.loadStatusRepo.createStatusHistory).toHaveBeenCalledWith({
        loadId: 'load-1',
        fromStatus: 'QUOTED',
        toStatus: 'BOOKED',
        changedByUserId: 'user-1',
        notes: undefined,
      });
    });

    it('throws NotFoundError when load does not exist', async () => {
      deps.loadRepository.findById.mockResolvedValue(null);

      await expect(
        service.transitionStatus({
          loadId: 'nonexistent',
          organizationId: 'org-1',
          targetStatus: 'BOOKED',
          userId: 'user-1',
          userRole: 'admin',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws InvalidTransitionError for disallowed transition', async () => {
      const load = createMockLoad({ status: 'QUOTED' });
      deps.loadRepository.findById.mockResolvedValue(load);

      await expect(
        service.transitionStatus({
          loadId: 'load-1',
          organizationId: 'org-1',
          targetStatus: 'DELIVERED',
          userId: 'user-1',
          userRole: 'admin',
        }),
      ).rejects.toThrow(InvalidTransitionError);
    });

    it('throws ForbiddenError when non-admin tries EXCEPTION transition', async () => {
      const load = createMockLoad({ status: 'IN_TRANSIT' });
      deps.loadRepository.findById.mockResolvedValue(load);

      await expect(
        service.transitionStatus({
          loadId: 'load-1',
          organizationId: 'org-1',
          targetStatus: 'EXCEPTION',
          userId: 'user-1',
          userRole: 'dispatcher',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws ValidationError when CANCELED transition has no notes', async () => {
      const load = createMockLoad({ status: 'QUOTED' });
      deps.loadRepository.findById.mockResolvedValue(load);

      await expect(
        service.transitionStatus({
          loadId: 'load-1',
          organizationId: 'org-1',
          targetStatus: 'CANCELED',
          userId: 'user-1',
          userRole: 'admin',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when dispatching without rate con', async () => {
      const load = createMockLoad({
        status: 'BOOKED',
        carrierId: 'carrier-1',
        driverId: 'driver-1',
        vehicleId: 'vehicle-1',
        rateConReceivedAt: null,
      });
      deps.loadRepository.findById.mockResolvedValue(load);

      await expect(
        service.transitionStatus({
          loadId: 'load-1',
          organizationId: 'org-1',
          targetStatus: 'DISPATCHED',
          userId: 'user-1',
          userRole: 'admin',
          overrideWarnings: false,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when dispatching without rate con even with overrideWarnings', async () => {
      const load = createMockLoad({
        status: 'BOOKED',
        carrierId: 'carrier-1',
        driverId: 'driver-1',
        vehicleId: 'vehicle-1',
        rateConReceivedAt: null,
      });
      deps.loadRepository.findById.mockResolvedValue(load);

      await expect(
        service.transitionStatus({
          loadId: 'load-1',
          organizationId: 'org-1',
          targetStatus: 'DISPATCHED',
          userId: 'user-1',
          userRole: 'admin',
          overrideWarnings: true,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('requires carrierId for BOOKED transition', async () => {
      const load = createMockLoad({ status: 'QUOTED', carrierId: null });
      deps.loadRepository.findById.mockResolvedValue(load);

      await expect(
        service.transitionStatus({
          loadId: 'load-1',
          organizationId: 'org-1',
          targetStatus: 'BOOKED',
          userId: 'user-1',
          userRole: 'admin',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('requires driverId and vehicleId for DISPATCHED transition', async () => {
      const load = createMockLoad({
        status: 'BOOKED',
        carrierId: 'carrier-1',
        driverId: null,
        vehicleId: null,
      });
      deps.loadRepository.findById.mockResolvedValue(load);

      await expect(
        service.transitionStatus({
          loadId: 'load-1',
          organizationId: 'org-1',
          targetStatus: 'DISPATCHED',
          userId: 'user-1',
          userRole: 'admin',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('creates TONU accessorial when transitioning to TONU', async () => {
      const load = createMockLoad({
        status: 'DISPATCHED',
        carrierId: 'carrier-1',
        driverId: 'driver-1',
        vehicleId: 'vehicle-1',
      });
      deps.loadRepository.findById.mockResolvedValue(load);
      deps.loadStatusRepo.updateStatus.mockResolvedValue(
        createMockLoad({ status: 'TONU' }),
      );

      await service.transitionStatus({
        loadId: 'load-1',
        organizationId: 'org-1',
        targetStatus: 'TONU',
        userId: 'user-1',
        userRole: 'admin',
      });

      expect(deps.loadStatusRepo.createAccessorialCharge).toHaveBeenCalledWith({
        loadId: 'load-1',
        type: 'TONU',
        description: 'Truck Order Not Used',
        amount: 250,
        billTo: 'customer',
        isAutoGenerated: true,
      });
    });

    it('publishes load.delivered event when transitioning to DELIVERED', async () => {
      const load = createMockLoad({ status: 'AT_DELIVERY', bolSignedAt: new Date() });
      deps.loadRepository.findById.mockResolvedValue(load);
      deps.loadStatusRepo.updateStatus.mockResolvedValue(
        createMockLoad({ status: 'DELIVERED' }),
      );

      await service.transitionStatus({
        loadId: 'load-1',
        organizationId: 'org-1',
        targetStatus: 'DELIVERED',
        userId: 'user-1',
        userRole: 'admin',
      });

      expect(deps.eventBus.publish).toHaveBeenCalledWith('load.delivered', {
        loadId: 'load-1',
        organizationId: 'org-1',
        status: 'DELIVERED',
      });
    });

    it('publishes load.canceled event when transitioning to CANCELED', async () => {
      const load = createMockLoad({ status: 'QUOTED' });
      deps.loadRepository.findById.mockResolvedValue(load);
      deps.loadStatusRepo.updateStatus.mockResolvedValue(
        createMockLoad({ status: 'CANCELED' }),
      );

      await service.transitionStatus({
        loadId: 'load-1',
        organizationId: 'org-1',
        targetStatus: 'CANCELED',
        notes: 'Customer canceled',
        userId: 'user-1',
        userRole: 'admin',
      });

      expect(deps.eventBus.publish).toHaveBeenCalledWith('load.canceled', {
        loadId: 'load-1',
        organizationId: 'org-1',
        status: 'CANCELED',
      });
    });

    it('publishes load.tonu event when transitioning to TONU', async () => {
      const load = createMockLoad({
        status: 'DISPATCHED',
        carrierId: 'carrier-1',
        driverId: 'driver-1',
        vehicleId: 'vehicle-1',
      });
      deps.loadRepository.findById.mockResolvedValue(load);
      deps.loadStatusRepo.updateStatus.mockResolvedValue(
        createMockLoad({ status: 'TONU' }),
      );

      await service.transitionStatus({
        loadId: 'load-1',
        organizationId: 'org-1',
        targetStatus: 'TONU',
        userId: 'user-1',
        userRole: 'admin',
      });

      expect(deps.eventBus.publish).toHaveBeenCalledWith('load.tonu', {
        loadId: 'load-1',
        organizationId: 'org-1',
        status: 'TONU',
      });
    });

    it('allows ADMIN to transition to EXCEPTION with notes', async () => {
      const load = createMockLoad({ status: 'IN_TRANSIT' });
      deps.loadRepository.findById.mockResolvedValue(load);
      deps.loadStatusRepo.updateStatus.mockResolvedValue(
        createMockLoad({ status: 'EXCEPTION' }),
      );

      const result = await service.transitionStatus({
        loadId: 'load-1',
        organizationId: 'org-1',
        targetStatus: 'EXCEPTION',
        notes: 'Cargo damaged',
        userId: 'user-1',
        userRole: 'ADMIN',
      });

      expect(result.success).toBe(true);
    });
  });
});
