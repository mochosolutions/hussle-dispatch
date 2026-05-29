import Decimal from 'decimal.js';
import { createLoadService } from '../loadService';

const buildLoadStub = () => ({
  id: 'load-1',
  organizationId: 'org-1',
  loadNumber: 'LD-001',
  customerId: 'cust-1',
  contact: {
    id: 'contact-1',
    email: 'contact@example.com',
    phone: '+15551234567',
    ccEmails: [],
  },
});

const buildCheckCallStub = () => ({
  id: 'cc-1',
  loadId: 'load-1',
  calledByUserId: 'user-1',
  location: 'Memphis, TN',
  latitude: new Decimal('35.1495'),
  longitude: new Decimal('-90.0490'),
  status: 'On time',
  eta: new Date('2026-05-27T18:00:00.000Z'),
  notes: null,
  brokerNotified: false,
  brokerNotes: null,
  createdAt: new Date('2026-05-27T12:00:00.000Z'),
});

const buildMocks = () => {
  const loadRepository = {
    findById: jest.fn().mockResolvedValue(buildLoadStub()),
    createCheckCall: jest.fn().mockResolvedValue(buildCheckCallStub()),
  };
  const eventBus = {
    publish: jest.fn().mockResolvedValue(undefined),
    publishDelayed: jest.fn(),
    subscribe: jest.fn(),
  };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  return { loadRepository, eventBus, logger };
};

describe('loadService.createCheckCall event publish', () => {
  it('publishes load.checkcall.logged with latitude/longitude/occurredAt', async () => {
    const { loadRepository, eventBus, logger } = buildMocks();
    const service = createLoadService({
      loadRepository,
      eventBus,
      logger,
    } as never);

    await service.createCheckCall({
      loadId: 'load-1',
      organizationId: 'org-1',
      userId: 'user-1',
      input: {
        location: 'Memphis, TN',
        latitude: 35.1495,
        longitude: -90.049,
        status: 'On time',
        eta: new Date('2026-05-27T18:00:00.000Z'),
        notes: null,
        brokerNotified: false,
        brokerNotes: null,
      },
    });

    // Wait a tick so the fire-and-forget publish resolves
    await new Promise((resolve) => setImmediate(resolve));

    expect(eventBus.publish).toHaveBeenCalledWith(
      'load.checkcall.logged',
      expect.objectContaining({
        loadId: 'load-1',
        latitude: 35.1495,
        longitude: -90.049,
        occurredAt: '2026-05-27T12:00:00.000Z',
      }),
    );
  });

  it('publishes lat/lng as null when dispatcher input omits coordinates', async () => {
    const { loadRepository, eventBus, logger } = buildMocks();
    const service = createLoadService({
      loadRepository,
      eventBus,
      logger,
    } as never);

    await service.createCheckCall({
      loadId: 'load-1',
      organizationId: 'org-1',
      userId: 'user-1',
      input: {
        location: 'Memphis, TN',
        status: 'On time',
        notes: 'Dispatcher manual entry',
        brokerNotified: false,
      },
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(eventBus.publish).toHaveBeenCalledWith(
      'load.checkcall.logged',
      expect.objectContaining({
        latitude: null,
        longitude: null,
      }),
    );
  });
});
