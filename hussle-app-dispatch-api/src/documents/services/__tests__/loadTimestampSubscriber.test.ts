import type { EventBus } from '../../../shared/messaging/eventBus';
import type { EventMap } from '../../../shared/messaging/eventMap';
import { createLoadTimestampSubscriber } from '../loadTimestampSubscriber';

type DocConfirmedPayload = EventMap['document.confirmed'];
type SubscribeHandler = (data: DocConfirmedPayload) => Promise<void>;

describe('createLoadTimestampSubscriber', () => {
  const mockEventBus: Pick<EventBus, 'subscribe'> = {
    subscribe: jest.fn(),
  };

  const mockLoadTimestampPort = {
    setTimestampIfNull: jest.fn().mockResolvedValue(undefined),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const deps = {
    eventBus: mockEventBus as EventBus,
    loadTimestampPort: mockLoadTimestampPort,
    logger: mockLogger,
  };

  let capturedHandler: SubscribeHandler;

  const bolSignedPayload: DocConfirmedPayload = {
    documentId: 'doc-1',
    entityType: 'load',
    entityId: 'load-1',
    documentType: 'BOL_SIGNED',
    organizationId: 'org-1',
    expiresAt: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockLoadTimestampPort.setTimestampIfNull.mockResolvedValue(undefined);

    (mockEventBus.subscribe as jest.Mock).mockImplementation(
      (_event: string, _queue: string, handler: SubscribeHandler) => {
        capturedHandler = handler;
        return Promise.resolve();
      },
    );

    await createLoadTimestampSubscriber(deps);
  });

  it('subscribes to document.confirmed on the load-timestamp-service queue', () => {
    expect(mockEventBus.subscribe).toHaveBeenCalledWith(
      'document.confirmed',
      'load-timestamp-service',
      expect.any(Function),
    );
  });

  it('skips non-load entity types', async () => {
    // Arrange
    const payload: DocConfirmedPayload = { ...bolSignedPayload, entityType: 'carrier' };

    // Act
    await capturedHandler(payload);

    // Assert
    expect(mockLoadTimestampPort.setTimestampIfNull).not.toHaveBeenCalled();
  });

  it('writes bolSignedAt set-if-null on first BOL_SIGNED delivery', async () => {
    // Act
    await capturedHandler(bolSignedPayload);

    // Assert
    expect(mockLoadTimestampPort.setTimestampIfNull).toHaveBeenCalledTimes(1);
    expect(mockLoadTimestampPort.setTimestampIfNull).toHaveBeenCalledWith(
      'load-1',
      'bolSignedAt',
      expect.any(Date),
    );
  });

  it('is idempotent: a duplicate delivery delegates to a set-if-null write each time, leaving bolSignedAt set once', async () => {
    // Arrange — port enforces set-if-null at the data layer, so the second
    // call is a no-op write (0 rows affected). The subscriber must NOT branch
    // on prior state itself; it simply re-issues the monotonic write.
    let stored: Date | null = null;
    mockLoadTimestampPort.setTimestampIfNull.mockImplementation(
      async (_loadId: string, _field: string, ts: Date) => {
        if (stored === null) {
          stored = ts;
        }
      },
    );

    // Act — same document.confirmed event delivered twice
    await capturedHandler(bolSignedPayload);
    const firstStored = stored;
    await capturedHandler(bolSignedPayload);

    // Assert — both deliveries route to set-if-null; the stored value never flips
    expect(mockLoadTimestampPort.setTimestampIfNull).toHaveBeenCalledTimes(2);
    expect(stored).toBe(firstStored);
    expect(stored).not.toBeNull();
  });

  it('routes BROKER_RATE_CON to rateConReceivedAt set-if-null', async () => {
    // Act
    await capturedHandler({ ...bolSignedPayload, documentType: 'BROKER_RATE_CON' });

    // Assert
    expect(mockLoadTimestampPort.setTimestampIfNull).toHaveBeenCalledWith(
      'load-1',
      'rateConReceivedAt',
      expect.any(Date),
    );
  });
});
