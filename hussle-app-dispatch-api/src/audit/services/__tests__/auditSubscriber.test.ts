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
    publishDelayed: jest.fn(),
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

  describe('document.archived subscription', () => {
    type ArchivedHandler = (data: EventMap['document.archived']) => Promise<void>;

    const captureArchivedHandler = async (): Promise<ArchivedHandler> => {
      await initializeAuditSubscriber({
        eventBus: mockEventBus,
        auditLogRepo: mockAuditLogRepo,
        logger: mockLogger,
      });

      const call = mockEventBus.subscribe.mock.calls.find(
        (c) => c[0] === 'document.archived',
      );
      if (!call) {
        throw new Error('document.archived subscription not registered');
      }
      return call[2] as ArchivedHandler;
    };

    const buildPayload = (
      overrides: Partial<EventMap['document.archived']> = {},
    ): EventMap['document.archived'] => ({
      documentId: 'doc-1',
      organizationId: 'org-1',
      fileName: 'rate.pdf',
      type: 'BROKER_RATE_CON',
      entityType: 'load',
      entityId: 'load-1',
      requestingUserId: 'user-7',
      ...overrides,
    });

    it('creates audit log with DOCUMENT_ARCHIVED action and metadata', async () => {
      // Arrange
      mockAuditLogRepo.create.mockResolvedValue({});
      const handler = await captureArchivedHandler();

      // Act
      await handler(buildPayload());

      // Assert
      expect(mockAuditLogRepo.create).toHaveBeenCalledWith('org-1', {
        userId: 'user-7',
        action: 'DOCUMENT_ARCHIVED',
        entityType: 'Document',
        entityId: 'doc-1',
        changes: null,
        metadata: {
          fileName: 'rate.pdf',
          type: 'BROKER_RATE_CON',
          entityType: 'load',
          entityId: 'load-1',
        },
      });
    });

    it('uses null userId when requestingUserId is missing', async () => {
      // Arrange
      mockAuditLogRepo.create.mockResolvedValue({});
      const handler = await captureArchivedHandler();

      // Act
      await handler(buildPayload({ requestingUserId: null }));

      // Assert
      expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({ userId: null }),
      );
    });

    it('logs error without throwing when audit creation fails', async () => {
      // Arrange
      mockAuditLogRepo.create.mockRejectedValue(new Error('boom'));
      const handler = await captureArchivedHandler();

      // Act
      await handler(buildPayload());

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create audit log for document.archived',
        expect.objectContaining({ documentId: 'doc-1', error: 'boom' }),
      );
    });
  });

  describe('document.replaced subscription', () => {
    type ReplacedHandler = (data: EventMap['document.replaced']) => Promise<void>;

    const captureReplacedHandler = async (): Promise<ReplacedHandler> => {
      await initializeAuditSubscriber({
        eventBus: mockEventBus,
        auditLogRepo: mockAuditLogRepo,
        logger: mockLogger,
      });

      const call = mockEventBus.subscribe.mock.calls.find(
        (c) => c[0] === 'document.replaced',
      );
      if (!call) {
        throw new Error('document.replaced subscription not registered');
      }
      return call[2] as ReplacedHandler;
    };

    const buildPayload = (
      overrides: Partial<EventMap['document.replaced']> = {},
    ): EventMap['document.replaced'] => ({
      priorDocumentId: 'prior-1',
      priorS3Key: 's3/prior-1',
      replacedBy: 'new-1',
      entityType: 'load',
      entityId: 'load-1',
      organizationId: 'org-1',
      documentType: 'BROKER_RATE_CON',
      requestingUserId: 'user-9',
      ...overrides,
    });

    it('creates audit log with DOCUMENT_REPLACED action and metadata', async () => {
      // Arrange
      mockAuditLogRepo.create.mockResolvedValue({});
      const handler = await captureReplacedHandler();

      // Act
      await handler(buildPayload());

      // Assert
      expect(mockAuditLogRepo.create).toHaveBeenCalledWith('org-1', {
        userId: 'user-9',
        action: 'DOCUMENT_REPLACED',
        entityType: 'Document',
        entityId: 'prior-1',
        changes: null,
        metadata: {
          replacedBy: 'new-1',
          priorS3Key: 's3/prior-1',
          type: 'BROKER_RATE_CON',
          entityType: 'load',
          entityId: 'load-1',
        },
      });
    });

    it('logs error without throwing when audit creation fails', async () => {
      // Arrange
      mockAuditLogRepo.create.mockRejectedValue(new Error('kaboom'));
      const handler = await captureReplacedHandler();

      // Act
      await handler(buildPayload());

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create audit log for document.replaced',
        expect.objectContaining({ priorDocumentId: 'prior-1', error: 'kaboom' }),
      );
    });
  });
});
