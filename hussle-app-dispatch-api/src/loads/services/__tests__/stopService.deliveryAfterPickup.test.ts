import type { Stop } from '@prisma/client';
import { createStopService } from '../stopService';
import { ValidationError } from '@/shared/errors';

const makeStop = (overrides: Partial<Stop>): Stop =>
  ({
    id: 'stop-existing',
    loadId: 'load-1',
    organizationId: 'org-1',
    sequence: 0,
    type: 'PICKUP',
    facilityName: 'Acme',
    address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    schedulingType: 'APPOINTMENT',
    appointmentStart: new Date('2026-05-01T10:00:00Z'),
    appointmentEnd: null,
    notificationHours: null,
    appointmentNumber: null,
    arrivalTime: null,
    departureTime: null,
    contactName: null,
    contactPhone: null,
    contactId: null,
    placeId: null,
    resolutionStatus: 'UNRESOLVED',
    commodity: null,
    weight: null,
    pieceCount: null,
    isHazmat: false,
    isTarp: false,
    isTempControlled: false,
    notes: null,
    callByTime: null,
    trailerNumber: null,
    yardLocation: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as Stop;

const makeDeps = (existingStops: Stop[]) => {
  const stopRepository = {
    create: jest.fn().mockResolvedValue(makeStop({})),
    update: jest.fn().mockResolvedValue(makeStop({})),
    delete: jest.fn(),
    findById: jest.fn().mockImplementation((id: string) =>
      Promise.resolve(existingStops.find((s) => s.id === id) ?? null),
    ),
    findByLoadId: jest.fn().mockResolvedValue(existingStops),
    reorder: jest.fn(),
  };
  const loadRepository = {
    findById: jest.fn().mockResolvedValue({ id: 'load-1', organizationId: 'org-1' }),
  };
  const eventBus = {
    publish: jest.fn().mockResolvedValue(undefined),
  };
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
  return {
    deps: {
      stopRepository,
      loadRepository,
      eventBus,
      logger,
    } as never,
    spies: { stopRepository, loadRepository, eventBus },
  };
};

describe('stopService.createStop — delivery-after-pickup', () => {
  it('rejects creating a DELIVERY before an existing PICKUP', async () => {
    const pickup = makeStop({
      id: 'p1',
      type: 'PICKUP',
      appointmentStart: new Date('2026-05-02T10:00:00Z'),
    });
    const { deps, spies } = makeDeps([pickup]);
    const service = createStopService(deps);

    await expect(
      service.createStop({
        organizationId: 'org-1',
        loadId: 'load-1',
        type: 'DELIVERY',
        appointmentStart: new Date('2026-05-01T10:00:00Z'),
      }),
    ).rejects.toThrow(ValidationError);

    expect(spies.stopRepository.create).not.toHaveBeenCalled();
  });

  it('accepts creating a DELIVERY after the latest existing PICKUP', async () => {
    const pickup = makeStop({
      id: 'p1',
      type: 'PICKUP',
      appointmentStart: new Date('2026-05-01T10:00:00Z'),
    });
    const { deps, spies } = makeDeps([pickup]);
    const service = createStopService(deps);

    await service.createStop({
      organizationId: 'org-1',
      loadId: 'load-1',
      type: 'DELIVERY',
      appointmentStart: new Date('2026-05-02T10:00:00Z'),
    });

    expect(spies.stopRepository.create).toHaveBeenCalled();
  });

  it('rejects adding a PICKUP that is later than an existing DELIVERY', async () => {
    const delivery = makeStop({
      id: 'd1',
      type: 'DELIVERY',
      appointmentStart: new Date('2026-05-02T10:00:00Z'),
    });
    const { deps, spies } = makeDeps([delivery]);
    const service = createStopService(deps);

    await expect(
      service.createStop({
        organizationId: 'org-1',
        loadId: 'load-1',
        type: 'PICKUP',
        appointmentStart: new Date('2026-05-03T10:00:00Z'),
      }),
    ).rejects.toThrow(ValidationError);

    expect(spies.stopRepository.create).not.toHaveBeenCalled();
  });
});

describe('stopService.updateStop — delivery-after-pickup', () => {
  it('rejects pushing a DELIVERY date earlier than the latest PICKUP', async () => {
    const pickup = makeStop({
      id: 'p1',
      type: 'PICKUP',
      appointmentStart: new Date('2026-05-02T10:00:00Z'),
    });
    const delivery = makeStop({
      id: 'd1',
      type: 'DELIVERY',
      appointmentStart: new Date('2026-05-03T10:00:00Z'),
    });
    const { deps, spies } = makeDeps([pickup, delivery]);
    const service = createStopService(deps);

    await expect(
      service.updateStop({
        id: 'd1',
        organizationId: 'org-1',
        appointmentStart: new Date('2026-05-01T10:00:00Z'),
      }),
    ).rejects.toThrow(ValidationError);

    expect(spies.stopRepository.update).not.toHaveBeenCalled();
  });

  it('rejects pushing a PICKUP date later than the earliest DELIVERY', async () => {
    const pickup = makeStop({
      id: 'p1',
      type: 'PICKUP',
      appointmentStart: new Date('2026-05-01T10:00:00Z'),
    });
    const delivery = makeStop({
      id: 'd1',
      type: 'DELIVERY',
      appointmentStart: new Date('2026-05-02T10:00:00Z'),
    });
    const { deps, spies } = makeDeps([pickup, delivery]);
    const service = createStopService(deps);

    await expect(
      service.updateStop({
        id: 'p1',
        organizationId: 'org-1',
        appointmentStart: new Date('2026-05-03T10:00:00Z'),
      }),
    ).rejects.toThrow(ValidationError);

    expect(spies.stopRepository.update).not.toHaveBeenCalled();
  });

  it('accepts a date update that keeps the order valid', async () => {
    const pickup = makeStop({
      id: 'p1',
      type: 'PICKUP',
      appointmentStart: new Date('2026-05-01T10:00:00Z'),
    });
    const delivery = makeStop({
      id: 'd1',
      type: 'DELIVERY',
      appointmentStart: new Date('2026-05-02T10:00:00Z'),
    });
    const { deps, spies } = makeDeps([pickup, delivery]);
    const service = createStopService(deps);

    await service.updateStop({
      id: 'd1',
      organizationId: 'org-1',
      appointmentStart: new Date('2026-05-03T10:00:00Z'),
    });

    expect(spies.stopRepository.update).toHaveBeenCalled();
  });
});
