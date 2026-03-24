import type { EventBus } from '../../../shared/messaging/eventBus';
import type { EventMap } from '../../../shared/messaging/eventMap';
import { initializeCarrierSubscriber } from '../carrierSubscriber';

type OrgCreatedPayload = EventMap['organization.created'];
type SubscribeHandler = (data: OrgCreatedPayload) => Promise<void>;

describe('initializeCarrierSubscriber', () => {
  const mockEventBus: Pick<EventBus, 'subscribe'> = {
    subscribe: jest.fn(),
  };

  const mockCarrierRepo = {
    create: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const deps = {
    eventBus: mockEventBus as EventBus,
    carrierRepo: mockCarrierRepo,
    logger: mockLogger,
  };

  let capturedHandler: SubscribeHandler;

  beforeEach(async () => {
    jest.clearAllMocks();

    (mockEventBus.subscribe as jest.Mock).mockImplementation(
      (_event: string, _queue: string, handler: SubscribeHandler) => {
        capturedHandler = handler;
        return Promise.resolve();
      },
    );

    await initializeCarrierSubscriber(deps);
  });

  it('calls subscribe with correct event name and queue group', () => {
    expect(mockEventBus.subscribe).toHaveBeenCalledWith(
      'organization.created',
      'carriers-service',
      expect.any(Function),
    );
  });

  it('skips carrier creation when orgRole is not CARRIER', async () => {
    // Arrange
    const payload: OrgCreatedPayload = {
      orgId: 'org-1',
      orgName: 'Broker Inc',
      orgRole: 'BROKER',
      userId: 'user-1',
      userEmail: 'user@broker.test',
      customMetadata: {},
    };

    // Act
    await capturedHandler(payload);

    // Assert
    expect(mockCarrierRepo.create).not.toHaveBeenCalled();
  });

  it('creates carrier with correct data when orgRole is CARRIER', async () => {
    // Arrange
    const payload: OrgCreatedPayload = {
      orgId: 'org-carrier-1',
      orgName: 'Fast Freight LLC',
      orgRole: 'CARRIER',
      userId: 'user-1',
      userEmail: 'user@fastfreight.test',
      customMetadata: {},
    };
    mockCarrierRepo.create.mockResolvedValue({});

    // Act
    await capturedHandler(payload);

    // Assert
    expect(mockCarrierRepo.create).toHaveBeenCalledWith('org-carrier-1', {
      name: 'Fast Freight LLC',
      type: 'COMPANY_ASSET',
      carrierOrgId: 'org-carrier-1',
      mcNumber: undefined,
      dotNumber: undefined,
      status: 'ACTIVE',
    });
  });

  it('creates carrier with correct data when orgRole is DISPATCH_COMPANY', async () => {
    // Arrange
    const payload: OrgCreatedPayload = {
      orgId: 'org-dispatch-1',
      orgName: 'Dispatch Corp',
      orgRole: 'DISPATCH_COMPANY',
      userId: 'user-1',
      userEmail: 'user@dispatchcorp.test',
      customMetadata: {
        mcNumber: 'MC-999999',
        dotNumber: 'DOT-888888',
      },
    };
    mockCarrierRepo.create.mockResolvedValue({});

    // Act
    await capturedHandler(payload);

    // Assert
    expect(mockCarrierRepo.create).toHaveBeenCalledWith('org-dispatch-1', {
      name: 'Dispatch Corp',
      type: 'COMPANY_ASSET',
      carrierOrgId: 'org-dispatch-1',
      mcNumber: 'MC-999999',
      dotNumber: 'DOT-888888',
      status: 'ACTIVE',
    });
  });

  it('extracts mcNumber and dotNumber from customMetadata when they are strings', async () => {
    // Arrange
    const payload: OrgCreatedPayload = {
      orgId: 'org-carrier-2',
      orgName: 'Big Rig Transport',
      orgRole: 'CARRIER',
      userId: 'user-2',
      userEmail: 'user@bigrig.test',
      customMetadata: {
        mcNumber: 'MC-123456',
        dotNumber: 'DOT-789012',
      },
    };
    mockCarrierRepo.create.mockResolvedValue({});

    // Act
    await capturedHandler(payload);

    // Assert
    expect(mockCarrierRepo.create).toHaveBeenCalledWith('org-carrier-2', {
      name: 'Big Rig Transport',
      type: 'COMPANY_ASSET',
      carrierOrgId: 'org-carrier-2',
      mcNumber: 'MC-123456',
      dotNumber: 'DOT-789012',
      status: 'ACTIVE',
    });
  });

  it('ignores non-string mcNumber and dotNumber in customMetadata', async () => {
    // Arrange
    const payload: OrgCreatedPayload = {
      orgId: 'org-carrier-3',
      orgName: 'Number Haulers',
      orgRole: 'CARRIER',
      userId: 'user-3',
      userEmail: 'user@numberhaulers.test',
      customMetadata: {
        mcNumber: 12345,
        dotNumber: { value: 'DOT-111' },
      },
    };
    mockCarrierRepo.create.mockResolvedValue({});

    // Act
    await capturedHandler(payload);

    // Assert
    expect(mockCarrierRepo.create).toHaveBeenCalledWith('org-carrier-3', {
      name: 'Number Haulers',
      type: 'COMPANY_ASSET',
      carrierOrgId: 'org-carrier-3',
      mcNumber: undefined,
      dotNumber: undefined,
      status: 'ACTIVE',
    });
  });

  it('logs error when carrier creation fails without throwing', async () => {
    // Arrange
    const payload: OrgCreatedPayload = {
      orgId: 'org-carrier-4',
      orgName: 'Failing Fleet',
      orgRole: 'CARRIER',
      userId: 'user-4',
      userEmail: 'user@failingfleet.test',
      customMetadata: {},
    };
    mockCarrierRepo.create.mockRejectedValue(new Error('DB connection lost'));

    // Act — should not throw
    await capturedHandler(payload);

    // Assert
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to auto-create carrier for org',
      {
        orgId: 'org-carrier-4',
        error: 'DB connection lost',
      },
    );
  });

  it('logs unknown error message when thrown error has no message property', async () => {
    // Arrange
    const payload: OrgCreatedPayload = {
      orgId: 'org-carrier-5',
      orgName: 'Mystery Fleet',
      orgRole: 'CARRIER',
      userId: 'user-5',
      userEmail: 'user@mysteryfleet.test',
      customMetadata: {},
    };
    mockCarrierRepo.create.mockRejectedValue('string-error');

    // Act
    await capturedHandler(payload);

    // Assert
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to auto-create carrier for org',
      {
        orgId: 'org-carrier-5',
        error: 'Unknown error',
      },
    );
  });
});
