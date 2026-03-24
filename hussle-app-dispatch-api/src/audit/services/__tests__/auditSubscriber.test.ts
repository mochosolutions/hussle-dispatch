import type { EventBus } from '../../../shared/messaging/eventBus';
import type { EventMap } from '../../../shared/messaging/eventMap';
import type { Logger } from '../../../shared/utils/logger';
import type { CreateAuditLogInput } from '../../types/auditTypes';
import { initializeAuditSubscriber } from '../auditSubscriber';

interface AuditLogCreatePort {
  create(organizationId: string, input: CreateAuditLogInput): Promise<unknown>;
}

type OrgCreatedHandler = (data: EventMap['organization.created']) => Promise<void>;

describe('initializeAuditSubscriber', () => {
  const mockEventBus: jest.Mocked<EventBus> = {
    publish: jest.fn(),
    subscribe: jest.fn(),
    close: jest.fn(),
  };

  const mockAuditLogRepo: jest.Mocked<AuditLogCreatePort> = {
    create: jest.fn(),
  };

  const mockLogger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventBus.subscribe.mockResolvedValue(undefined);
  });

  const captureHandler = async (): Promise<OrgCreatedHandler> => {
    await initializeAuditSubscriber({
      eventBus: mockEventBus,
      auditLogRepo: mockAuditLogRepo,
      logger: mockLogger,
    });

    const call = mockEventBus.subscribe.mock.calls[0];
    if (!call) {
      throw new Error('subscribe was not called');
    }
    return call[2] as OrgCreatedHandler;
  };

  const buildOrgCreatedPayload = (): EventMap['organization.created'] => ({
    orgId: 'org-123',
    orgName: 'Test Organization',
    orgRole: 'admin',
    userId: 'user-456',
    userEmail: 'test@example.com',
    customMetadata: {},
  });

  it('subscribes to organization.created with audit-service queue group', async () => {
    await initializeAuditSubscriber({
      eventBus: mockEventBus,
      auditLogRepo: mockAuditLogRepo,
      logger: mockLogger,
    });

    expect(mockEventBus.subscribe).toHaveBeenCalledWith(
      'organization.created',
      'audit-service',
      expect.any(Function),
    );
  });

  it('creates audit log entry with correct data on organization.created event', async () => {
    // Arrange
    mockAuditLogRepo.create.mockResolvedValue({});
    const handler = await captureHandler();
    const payload = buildOrgCreatedPayload();

    // Act
    await handler(payload);

    // Assert
    expect(mockAuditLogRepo.create).toHaveBeenCalledWith('org-123', {
      userId: 'user-456',
      action: 'CREATE',
      entityType: 'User',
      entityId: 'user-456',
      changes: null,
      metadata: {
        email: 'test@example.com',
        organizationName: 'Test Organization',
        action: 'signup',
      },
    });
  });

  it('logs success after creating audit log entry', async () => {
    // Arrange
    mockAuditLogRepo.create.mockResolvedValue({});
    const handler = await captureHandler();
    const payload = buildOrgCreatedPayload();

    // Act
    await handler(payload);

    // Assert
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Audit log created for organization signup',
      { orgId: 'org-123', userId: 'user-456' },
    );
  });

  it('logs error when audit log creation fails without throwing', async () => {
    // Arrange
    const dbError = new Error('Database connection lost');
    mockAuditLogRepo.create.mockRejectedValue(dbError);
    const handler = await captureHandler();
    const payload = buildOrgCreatedPayload();

    // Act — should not throw
    await handler(payload);

    // Assert
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to create audit log for organization signup',
      {
        orgId: 'org-123',
        userId: 'user-456',
        error: 'Database connection lost',
      },
    );
  });

  it('logs error message as string when non-Error is thrown', async () => {
    // Arrange
    mockAuditLogRepo.create.mockRejectedValue('unexpected string error');
    const handler = await captureHandler();
    const payload = buildOrgCreatedPayload();

    // Act
    await handler(payload);

    // Assert
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to create audit log for organization signup',
      {
        orgId: 'org-123',
        userId: 'user-456',
        error: 'unexpected string error',
      },
    );
  });

  it('logs initialization message after subscribing', async () => {
    await initializeAuditSubscriber({
      eventBus: mockEventBus,
      auditLogRepo: mockAuditLogRepo,
      logger: mockLogger,
    });

    expect(mockLogger.info).toHaveBeenCalledWith('Audit subscriber initialized');
  });
});
