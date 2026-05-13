import type { EventBus } from '../../../shared/messaging/eventBus';
import type { EventMap } from '../../../shared/messaging/eventMap';
import type { Logger } from '../../../shared/utils/logger';
import type { DocumentRepoPort, DocumentWithUploader } from '../../types/documentTypes';
import { createDocumentArchiveSubscriber } from '../documentArchiveSubscriber';

type ConfirmedHandler = (data: EventMap['document.confirmed']) => Promise<void>;

const makeDoc = (overrides: Partial<DocumentWithUploader> = {}): DocumentWithUploader => ({
  id: 'prior-doc-1',
  organizationId: 'org-1',
  entityType: 'load',
  entityId: 'load-1',
  type: 'BROKER_RATE_CON',
  fileName: 'rate.pdf',
  mimeType: 'application/pdf',
  s3Key: 'org-1/loads/load-1/broker_rate_con/rate.pdf',
  url: 'https://s3.example.com/prior',
  uploadStatus: 'confirmed',
  isArchived: true,
  uploadedByUserId: 'user-1',
  uploadedByUser: { firstName: 'Alice', lastName: 'Adams' },
  notes: null,
  expiresAt: null,
  metadata: null,
  fileSize: null,
  reviewStatus: 'pending_review',
  reviewedAt: null,
  reviewedByUserId: null,
  rejectionReason: null,
  signatureData: null,
  signedAt: null,
  createdAt: new Date('2026-01-01'),
  ...overrides,
} as DocumentWithUploader);

describe('createDocumentArchiveSubscriber', () => {
  const mockEventBus: jest.Mocked<EventBus> = {
    publish: jest.fn(),
    publishDelayed: jest.fn(),
    subscribe: jest.fn(),
    close: jest.fn(),
  };

  const mockDocumentRepository: jest.Mocked<DocumentRepoPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findManyByIds: jest.fn(),
    updateUploadStatus: jest.fn(),
    archiveByEntityAndType: jest.fn(),
    archive: jest.fn(),
    findMany: jest.fn(),
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
    mockEventBus.publish.mockResolvedValue(undefined);
  });

  const captureHandler = async (): Promise<ConfirmedHandler> => {
    await createDocumentArchiveSubscriber({
      eventBus: mockEventBus,
      documentRepository: mockDocumentRepository,
      logger: mockLogger,
    });

    const call = mockEventBus.subscribe.mock.calls[0];
    if (!call) {
      throw new Error('subscribe was not called');
    }
    return call[2] as ConfirmedHandler;
  };

  const buildPayload = (
    overrides: Partial<EventMap['document.confirmed']> = {},
  ): EventMap['document.confirmed'] => ({
    documentId: 'new-doc-1',
    entityType: 'load',
    entityId: 'load-1',
    documentType: 'BROKER_RATE_CON',
    organizationId: 'org-1',
    expiresAt: null,
    ...overrides,
  });

  it('subscribes to document.confirmed with document-archive-service queue group', async () => {
    await createDocumentArchiveSubscriber({
      eventBus: mockEventBus,
      documentRepository: mockDocumentRepository,
      logger: mockLogger,
    });

    expect(mockEventBus.subscribe).toHaveBeenCalledWith(
      'document.confirmed',
      'document-archive-service',
      expect.any(Function),
    );
  });

  it('archives priors and publishes document.replaced for each superseded row when type is onePer', async () => {
    // Arrange
    const prior1 = makeDoc({ id: 'prior-1', s3Key: 's3/prior-1' });
    const prior2 = makeDoc({ id: 'prior-2', s3Key: 's3/prior-2' });
    mockDocumentRepository.archiveByEntityAndType.mockResolvedValue([prior1, prior2]);
    const handler = await captureHandler();

    // Act
    await handler(buildPayload({ requestingUserId: 'admin-1' }));

    // Assert
    expect(mockDocumentRepository.archiveByEntityAndType).toHaveBeenCalledWith(
      'load',
      'load-1',
      'BROKER_RATE_CON',
      'new-doc-1',
    );
    expect(mockEventBus.publish).toHaveBeenCalledTimes(2);
    expect(mockEventBus.publish).toHaveBeenCalledWith('document.replaced', {
      priorDocumentId: 'prior-1',
      priorS3Key: 's3/prior-1',
      replacedBy: 'new-doc-1',
      entityType: 'load',
      entityId: 'load-1',
      organizationId: 'org-1',
      documentType: 'BROKER_RATE_CON',
      requestingUserId: 'admin-1',
    });
    expect(mockEventBus.publish).toHaveBeenCalledWith('document.replaced', {
      priorDocumentId: 'prior-2',
      priorS3Key: 's3/prior-2',
      replacedBy: 'new-doc-1',
      entityType: 'load',
      entityId: 'load-1',
      organizationId: 'org-1',
      documentType: 'BROKER_RATE_CON',
      requestingUserId: 'admin-1',
    });
  });

  it('does not call archiveByEntityAndType nor publish when documentType is not onePer', async () => {
    // Arrange
    const handler = await captureHandler();

    // Act
    await handler(buildPayload({ documentType: 'OTHER' }));

    // Assert
    expect(mockDocumentRepository.archiveByEntityAndType).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('does not publish document.replaced when there are no prior docs to archive', async () => {
    // Arrange
    mockDocumentRepository.archiveByEntityAndType.mockResolvedValue([]);
    const handler = await captureHandler();

    // Act
    await handler(buildPayload());

    // Assert
    expect(mockDocumentRepository.archiveByEntityAndType).toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('logs error and does not throw when archiveByEntityAndType fails', async () => {
    // Arrange
    mockDocumentRepository.archiveByEntityAndType.mockRejectedValue(new Error('db down'));
    const handler = await captureHandler();

    // Act — should not throw
    await handler(buildPayload());

    // Assert
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to archive prior documents on document.confirmed',
      expect.objectContaining({ documentId: 'new-doc-1', error: 'db down' }),
    );
  });

  it('passes null requestingUserId in document.replaced when not provided', async () => {
    // Arrange
    mockDocumentRepository.archiveByEntityAndType.mockResolvedValue([
      makeDoc({ id: 'prior-x', s3Key: 's3/prior-x' }),
    ]);
    const handler = await captureHandler();

    // Act
    await handler(buildPayload());

    // Assert
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'document.replaced',
      expect.objectContaining({ requestingUserId: null }),
    );
  });
});
