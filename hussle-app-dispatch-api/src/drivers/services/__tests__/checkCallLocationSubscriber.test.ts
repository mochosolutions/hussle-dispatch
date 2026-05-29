import type { EventMap } from '@/shared/messaging/eventMap';
import { initializeCheckCallLocationSubscriber } from '../checkCallLocationSubscriber';

const createDeps = () => {
  const handlers = new Map<string, (data: unknown) => Promise<void>>();
  const repo = {
    findDriverByLoadId: jest.fn(),
    updateDriverLocation: jest.fn(),
  };
  const eventBus = {
    publish: jest.fn(),
    publishDelayed: jest.fn(),
    subscribe: jest.fn(async (event: string, _group: string, handler: (data: unknown) => Promise<void>) => {
      handlers.set(event, handler);
    }),
  };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const invoke = async (event: keyof EventMap, data: EventMap[keyof EventMap]) => {
    const handler = handlers.get(event);
    if (handler === undefined) throw new Error(`No handler for ${String(event)}`);
    await handler(data);
  };

  return { deps: { eventBus, repo, logger }, invoke };
};

const buildPayload = (
  overrides: Partial<EventMap['load.checkcall.logged']> = {},
): EventMap['load.checkcall.logged'] => ({
  loadId: 'load-1',
  organizationId: 'org-1',
  loadNumber: 'LD-001',
  checkCallId: 'cc-1',
  customerId: null,
  contactEmail: null,
  contactPhone: null,
  contactCcEmails: [],
  location: null,
  status: null,
  eta: null,
  latitude: 36.1627,
  longitude: -86.7816,
  occurredAt: '2026-05-27T12:00:00.000Z',
  ...overrides,
});

describe('checkCallLocationSubscriber', () => {
  it('updates Driver currentLatitude/currentLongitude/lastLocationAt when event has coords', async () => {
    // Arrange
    const { deps, invoke } = createDeps();
    deps.repo.findDriverByLoadId.mockResolvedValue({
      driverId: 'driver-1',
      lastLocationAt: null,
    });
    await initializeCheckCallLocationSubscriber(deps as never);

    // Act
    await invoke('load.checkcall.logged', buildPayload());

    // Assert
    expect(deps.repo.updateDriverLocation).toHaveBeenCalledWith('driver-1', {
      latitude: 36.1627,
      longitude: -86.7816,
      lastLocationAt: new Date('2026-05-27T12:00:00.000Z'),
    });
  });

  it('no-ops when latitude is null (GPS denied note-only check-in)', async () => {
    const { deps, invoke } = createDeps();
    await initializeCheckCallLocationSubscriber(deps as never);

    await invoke(
      'load.checkcall.logged',
      buildPayload({ latitude: null, longitude: null }),
    );

    expect(deps.repo.findDriverByLoadId).not.toHaveBeenCalled();
    expect(deps.repo.updateDriverLocation).not.toHaveBeenCalled();
  });

  it('no-ops when load has no driver assigned', async () => {
    const { deps, invoke } = createDeps();
    deps.repo.findDriverByLoadId.mockResolvedValue(null);
    await initializeCheckCallLocationSubscriber(deps as never);

    await invoke('load.checkcall.logged', buildPayload());

    expect(deps.repo.updateDriverLocation).not.toHaveBeenCalled();
  });

  it('skips stale events older than current lastLocationAt', async () => {
    const { deps, invoke } = createDeps();
    deps.repo.findDriverByLoadId.mockResolvedValue({
      driverId: 'driver-1',
      lastLocationAt: new Date('2026-05-27T14:00:00.000Z'),
    });
    await initializeCheckCallLocationSubscriber(deps as never);

    await invoke(
      'load.checkcall.logged',
      buildPayload({ occurredAt: '2026-05-27T12:00:00.000Z' }),
    );

    expect(deps.repo.updateDriverLocation).not.toHaveBeenCalled();
  });

  it('applies update when event is newer than lastLocationAt', async () => {
    const { deps, invoke } = createDeps();
    deps.repo.findDriverByLoadId.mockResolvedValue({
      driverId: 'driver-1',
      lastLocationAt: new Date('2026-05-27T10:00:00.000Z'),
    });
    await initializeCheckCallLocationSubscriber(deps as never);

    await invoke(
      'load.checkcall.logged',
      buildPayload({ occurredAt: '2026-05-27T12:00:00.000Z' }),
    );

    expect(deps.repo.updateDriverLocation).toHaveBeenCalledTimes(1);
  });

  it('logs error and swallows when repo throws (does not break event bus)', async () => {
    const { deps, invoke } = createDeps();
    deps.repo.findDriverByLoadId.mockRejectedValue(new Error('db down'));
    await initializeCheckCallLocationSubscriber(deps as never);

    await expect(invoke('load.checkcall.logged', buildPayload())).resolves.not.toThrow();
    expect(deps.logger.error).toHaveBeenCalledWith(
      'Failed to process check call for driver location',
      expect.objectContaining({ loadId: 'load-1' }),
    );
  });
});
