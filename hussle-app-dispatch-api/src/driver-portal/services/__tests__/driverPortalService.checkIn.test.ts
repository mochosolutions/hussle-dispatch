import { createDriverPortalService } from '../driverPortalService';

const buildLoad = () => ({
  id: 'load-1',
  loadNumber: 'LD-001',
  organizationId: 'org-1',
  status: 'IN_TRANSIT',
  equipmentType: null,
  commodity: null,
  weight: null,
  driverInstructions: null,
  stops: [],
  driver: null,
});

const buildCheckCall = () => ({
  id: 'cc-1',
  loadId: 'load-1',
  location: null,
  latitude: 36.1627,
  longitude: -86.7816,
  status: null,
  eta: null,
  notes: null,
  createdAt: new Date('2026-05-27T12:00:00.000Z'),
});

const createDeps = () => ({
  loadQuery: {
    findLoadForDriverPortal: jest.fn().mockResolvedValue(buildLoad()),
  },
  checkCallRepo: {
    create: jest.fn().mockResolvedValue(buildCheckCall()),
  },
  loadStatusService: {
    transitionStatus: jest.fn(),
  },
  eventBus: {
    publish: jest.fn().mockResolvedValue(undefined),
    publishDelayed: jest.fn(),
    subscribe: jest.fn(),
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
});

describe('driverPortalService.checkIn', () => {
  it('publishes load.checkcall.logged with latitude/longitude and occurredAt', async () => {
    // Arrange
    const deps = createDeps();
    const service = createDriverPortalService(deps as never);

    // Act
    await service.checkIn('load-1', {
      latitude: 36.1627,
      longitude: -86.7816,
    });

    // Assert
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'load.checkcall.logged',
      expect.objectContaining({
        loadId: 'load-1',
        latitude: 36.1627,
        longitude: -86.7816,
        occurredAt: '2026-05-27T12:00:00.000Z',
      }),
    );
  });

  it('publishes lat/lng as null when input omits them (denied GPS notes-only)', async () => {
    const deps = createDeps();
    deps.checkCallRepo.create.mockResolvedValue({
      ...buildCheckCall(),
      latitude: null,
      longitude: null,
      notes: 'Stuck in traffic',
    });
    const service = createDriverPortalService(deps as never);

    await service.checkIn('load-1', { notes: 'Stuck in traffic' });

    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'load.checkcall.logged',
      expect.objectContaining({
        latitude: null,
        longitude: null,
      }),
    );
  });
});
