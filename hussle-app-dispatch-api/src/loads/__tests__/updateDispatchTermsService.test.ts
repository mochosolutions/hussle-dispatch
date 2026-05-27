import { updateDispatchTerms } from '../services/updateDispatchTermsService';
import type { LoadRepoPort, LoadWithRelations } from '../types/loadTypes';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { NotFoundError } from '@/shared/errors';

const createMockLoad = (overrides: Partial<LoadWithRelations> = {}): LoadWithRelations =>
  ({
    id: 'load-1',
    organizationId: 'org-1',
    loadNumber: 'L-001',
    status: 'QUOTED',
    dispatchFeeType: 'PERCENTAGE',
    dispatchFeeAmount: '10',
    partnerSplitPercent: '50',
    driverPayType: null,
    driverPayRate: null,
    dispatcherCommissionType: null,
    dispatcherCommissionRate: null,
    feeIncludesAccessorials: true,
    payFromNet: false,
    stops: [],
    carrier: null,
    driver: null,
    vehicle: null,
    contact: null,
    statusHistory: [],
    checkCalls: [],
    accessorialCharges: [],
    ...overrides,
  }) as unknown as LoadWithRelations;

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

  const eventBus: jest.Mocked<EventBus> = {
    publish: jest.fn().mockResolvedValue(undefined),
    publishDelayed: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    isReady: jest.fn().mockReturnValue(true),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return { loadRepository, eventBus, logger };
};

describe('updateDispatchTerms', () => {
  let deps: ReturnType<typeof createMockDeps>;

  beforeEach(() => {
    deps = createMockDeps();
  });

  it('throws NotFoundError when load does not exist', async () => {
    deps.loadRepository.findById.mockResolvedValue(null);

    await expect(
      updateDispatchTerms(
        {
          loadId: 'missing',
          organizationId: 'org-1',
          requestingUserId: 'user-1',
          fields: { dispatchFeeAmount: '15' },
        },
        deps,
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it('updates only provided fields and emits audit event with before/after diff', async () => {
    const existing = createMockLoad({ dispatchFeeAmount: '10', partnerSplitPercent: '50' });
    deps.loadRepository.findById.mockResolvedValue(existing);
    deps.loadRepository.update.mockResolvedValue(
      createMockLoad({ dispatchFeeAmount: '15', partnerSplitPercent: '50' }),
    );

    const result = await updateDispatchTerms(
      {
        loadId: 'load-1',
        organizationId: 'org-1',
        requestingUserId: 'user-1',
        fields: { dispatchFeeAmount: '15' },
      },
      deps,
    );

    expect(deps.loadRepository.update).toHaveBeenCalledWith('load-1', {
      dispatchFeeAmount: '15',
    });
    expect(deps.eventBus.publish).toHaveBeenCalledWith('load.dispatch-terms.updated', {
      loadId: 'load-1',
      organizationId: 'org-1',
      loadNumber: 'L-001',
      requestingUserId: 'user-1',
      changes: {
        dispatchFeeAmount: { old: '10', new: '15' },
      },
    });
    expect(result.load.dispatchFeeAmount).toBe('15');
  });

  it('does not emit event when provided values equal existing values', async () => {
    const existing = createMockLoad({ dispatchFeeAmount: '10', payFromNet: false });
    deps.loadRepository.findById.mockResolvedValue(existing);
    deps.loadRepository.update.mockResolvedValue(existing);

    await updateDispatchTerms(
      {
        loadId: 'load-1',
        organizationId: 'org-1',
        requestingUserId: 'user-1',
        fields: { dispatchFeeAmount: '10', payFromNet: false },
      },
      deps,
    );

    expect(deps.loadRepository.update).toHaveBeenCalled();
    expect(deps.eventBus.publish).not.toHaveBeenCalled();
  });

  it('treats undefined fields as skip and does not overwrite to null', async () => {
    const existing = createMockLoad({ dispatchFeeAmount: '10', partnerSplitPercent: '50' });
    deps.loadRepository.findById.mockResolvedValue(existing);
    deps.loadRepository.update.mockResolvedValue(existing);

    await updateDispatchTerms(
      {
        loadId: 'load-1',
        organizationId: 'org-1',
        requestingUserId: 'user-1',
        fields: { partnerSplitPercent: '60' },
      },
      deps,
    );

    const updateArg = deps.loadRepository.update.mock.calls[0]?.[1];
    expect(updateArg).toEqual({ partnerSplitPercent: '60' });
    expect(updateArg).not.toHaveProperty('dispatchFeeAmount');
  });

  it('skips repo update when no fields provided', async () => {
    const existing = createMockLoad();
    deps.loadRepository.findById.mockResolvedValue(existing);

    const result = await updateDispatchTerms(
      {
        loadId: 'load-1',
        organizationId: 'org-1',
        requestingUserId: 'user-1',
        fields: {},
      },
      deps,
    );

    expect(deps.loadRepository.update).not.toHaveBeenCalled();
    expect(deps.eventBus.publish).not.toHaveBeenCalled();
    expect(result.load).toBe(existing);
  });
});
