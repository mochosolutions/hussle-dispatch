import { createDocumentService } from '../documentService';
import {
  DocumentNotFoundError,
  DocumentAlreadyConfirmedError,
  DocumentUploadNotConfirmedError,
} from '../../types/documentErrors';
import {
  PRESIGN_EXPIRATION_SECONDS,
  STANDARD_DOWNLOAD_TTL_SECONDS,
  UPLOAD_STATUS,
} from '../../types/documentTypes';
import type { DocumentRepoPort, DocumentWithUploader } from '../../types/documentTypes';
import type { StorageProvider } from '../../../shared/storage/storageProvider';
import type { EventBus } from '../../../shared/messaging/eventBus';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDocument = (overrides: Partial<DocumentWithUploader> = {}): DocumentWithUploader => ({
  id: 'doc-1',
  organizationId: 'org-1',
  entityType: 'load',
  entityId: 'load-1',
  type: 'BOL_SIGNED',
  fileName: 'bol.pdf',
  mimeType: 'application/pdf',
  s3Key: 'org-1/loads/load-1/bol_signed/bol.pdf',
  url: 'https://s3.example.com/presigned-put',
  uploadStatus: UPLOAD_STATUS.PENDING,
  isArchived: false,
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

const buildMockDeps = () => {
  const documentRepository: jest.Mocked<DocumentRepoPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findManyByIds: jest.fn(),
    updateUploadStatus: jest.fn(),
    archiveByEntityAndType: jest.fn(),
    archive: jest.fn(),
    findMany: jest.fn(),
  };

  const storageProvider: jest.Mocked<Pick<
    StorageProvider,
    'getPresignedPutUrl' | 'getPresignedGetUrl' | 'exists' | 'getMetadata' | 'delete'
  >> = {
    getPresignedPutUrl: jest.fn(),
    getPresignedGetUrl: jest.fn(),
    exists: jest.fn(),
    getMetadata: jest.fn().mockResolvedValue({ size: 0 }),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const eventBus: jest.Mocked<EventBus> = {
    publish: jest.fn().mockResolvedValue(undefined),
    publishDelayed: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };

  return {
    documentRepository,
    storageProvider: storageProvider as unknown as jest.Mocked<StorageProvider>,
    eventBus,
  };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createDocumentService', () => {
  let deps: ReturnType<typeof buildMockDeps>;
  let service: ReturnType<typeof createDocumentService>;

  beforeEach(() => {
    jest.clearAllMocks();
    deps = buildMockDeps();
    service = createDocumentService(deps);
  });

  // -----------------------------------------------------------------------
  // presign
  // -----------------------------------------------------------------------

  describe('presign', () => {
    it('builds correct S3 key and returns presigned URL with document id', async () => {
      // Arrange
      const input = {
        organizationId: 'org-1',
        entityType: 'load' as const,
        entityId: 'load-1',
        type: 'BOL_SIGNED' as const,
        fileName: 'bol.pdf',
        mimeType: 'application/pdf',
      };

      const createdDoc = makeDocument({ id: 'new-doc-id' });
      deps.storageProvider.getPresignedPutUrl.mockResolvedValue('https://s3.example.com/presigned');
      deps.documentRepository.create.mockResolvedValue(createdDoc);

      // Act
      const result = await service.presign(input);

      // Assert
      expect(deps.storageProvider.getPresignedPutUrl).toHaveBeenCalledWith(
        'org-1/loads/load-1/bol_signed/bol.pdf',
        'application/pdf',
        PRESIGN_EXPIRATION_SECONDS,
      );
      expect(deps.documentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          entityType: 'load',
          entityId: 'load-1',
          type: 'BOL_SIGNED',
          fileName: 'bol.pdf',
          mimeType: 'application/pdf',
          s3Key: 'org-1/loads/load-1/bol_signed/bol.pdf',
          uploadStatus: UPLOAD_STATUS.PENDING,
        }),
      );
      expect(result).toEqual({
        documentId: 'new-doc-id',
        presignedUrl: 'https://s3.example.com/presigned',
        expiresIn: PRESIGN_EXPIRATION_SECONDS,
      });
    });
  });

  // -----------------------------------------------------------------------
  // confirm
  // -----------------------------------------------------------------------

  describe('confirm', () => {
    const confirmInput = { documentId: 'doc-1', organizationId: 'org-1' };

    it('throws DocumentNotFoundError when document does not exist', async () => {
      // Arrange
      deps.documentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.confirm(confirmInput)).rejects.toThrow(DocumentNotFoundError);
    });

    it('throws DocumentAlreadyConfirmedError when document is already confirmed', async () => {
      // Arrange
      const doc = makeDocument({ uploadStatus: UPLOAD_STATUS.CONFIRMED });
      deps.documentRepository.findById.mockResolvedValue(doc);

      // Act & Assert
      await expect(service.confirm(confirmInput)).rejects.toThrow(DocumentAlreadyConfirmedError);
    });

    it('throws DocumentUploadNotConfirmedError when file does not exist in storage', async () => {
      // Arrange
      const doc = makeDocument({ uploadStatus: UPLOAD_STATUS.PENDING });
      deps.documentRepository.findById.mockResolvedValue(doc);
      deps.storageProvider.exists.mockResolvedValue(false);

      // Act & Assert
      await expect(service.confirm(confirmInput)).rejects.toThrow(
        DocumentUploadNotConfirmedError,
      );
    });

    it('confirms document and publishes document.confirmed event', async () => {
      // Arrange
      const doc = makeDocument({ uploadStatus: UPLOAD_STATUS.PENDING });
      const confirmedDoc = makeDocument({ uploadStatus: UPLOAD_STATUS.CONFIRMED });
      deps.documentRepository.findById.mockResolvedValue(doc);
      deps.storageProvider.exists.mockResolvedValue(true);
      deps.storageProvider.getMetadata.mockResolvedValue({ size: 4096 });
      deps.documentRepository.updateUploadStatus.mockResolvedValue(confirmedDoc);

      // Act
      const result = await service.confirm(confirmInput);

      // Assert
      expect(deps.storageProvider.exists).toHaveBeenCalledWith(doc.s3Key);
      expect(deps.storageProvider.getMetadata).toHaveBeenCalledWith(doc.s3Key);
      expect(deps.documentRepository.updateUploadStatus).toHaveBeenCalledWith(
        'doc-1',
        UPLOAD_STATUS.CONFIRMED,
        4096,
      );
      expect(deps.eventBus.publish).toHaveBeenCalledWith('document.confirmed', {
        documentId: 'doc-1',
        entityType: 'load',
        entityId: 'load-1',
        documentType: 'BOL_SIGNED',
        organizationId: 'org-1',
        requestingUserId: null,
      });
      expect(result).toEqual(confirmedDoc);
    });

    it('forwards requestingUserId in document.confirmed event when provided', async () => {
      // Arrange
      const doc = makeDocument({ uploadStatus: UPLOAD_STATUS.PENDING });
      const confirmedDoc = makeDocument({ uploadStatus: UPLOAD_STATUS.CONFIRMED });
      deps.documentRepository.findById.mockResolvedValue(doc);
      deps.storageProvider.exists.mockResolvedValue(true);
      deps.documentRepository.updateUploadStatus.mockResolvedValue(confirmedDoc);

      // Act
      await service.confirm({ ...confirmInput, requestingUserId: 'user-42' });

      // Assert
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'document.confirmed',
        expect.objectContaining({ requestingUserId: 'user-42' }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // getDownloadUrl
  // -----------------------------------------------------------------------

  describe('getDownloadUrl', () => {
    const downloadInput = { id: 'doc-1', organizationId: 'org-1' };

    it('throws DocumentNotFoundError when document does not exist', async () => {
      // Arrange
      deps.documentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getDownloadUrl(downloadInput)).rejects.toThrow(
        DocumentNotFoundError,
      );
    });

    it('throws DocumentUploadNotConfirmedError when document is not confirmed', async () => {
      // Arrange
      const doc = makeDocument({ uploadStatus: UPLOAD_STATUS.PENDING });
      deps.documentRepository.findById.mockResolvedValue(doc);

      // Act & Assert
      await expect(service.getDownloadUrl(downloadInput)).rejects.toThrow(
        DocumentUploadNotConfirmedError,
      );
    });

    it('returns presigned GET URL for confirmed document', async () => {
      // Arrange
      const doc = makeDocument({ uploadStatus: UPLOAD_STATUS.CONFIRMED });
      deps.documentRepository.findById.mockResolvedValue(doc);
      deps.storageProvider.getPresignedGetUrl.mockResolvedValue(
        'https://s3.example.com/presigned-get',
      );

      // Act
      const result = await service.getDownloadUrl(downloadInput);

      // Assert
      expect(deps.storageProvider.getPresignedGetUrl).toHaveBeenCalledWith(
        doc.s3Key,
        STANDARD_DOWNLOAD_TTL_SECONDS,
        'bol-signed-load-load-1-2026-01-01.pdf',
      );
      expect(result).toBe('https://s3.example.com/presigned-get');
    });
  });

  // -----------------------------------------------------------------------
  // archive
  // -----------------------------------------------------------------------

  describe('archive', () => {
    const archiveInput = { id: 'doc-1', organizationId: 'org-1' };

    it('throws DocumentNotFoundError when document does not exist', async () => {
      // Arrange
      deps.documentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.archive(archiveInput)).rejects.toThrow(DocumentNotFoundError);
    });

    it('archives the document via repository', async () => {
      // Arrange
      const doc = makeDocument();
      const archivedDoc = makeDocument({ isArchived: true });
      deps.documentRepository.findById.mockResolvedValue(doc);
      deps.documentRepository.archive.mockResolvedValue(archivedDoc);

      // Act
      const result = await service.archive(archiveInput);

      // Assert
      expect(deps.documentRepository.archive).toHaveBeenCalledWith('doc-1');
      expect(result).toEqual(archivedDoc);
    });

    it('publishes document.archived event after successful archive', async () => {
      // Arrange
      const doc = makeDocument();
      const archivedDoc = makeDocument({ isArchived: true });
      deps.documentRepository.findById.mockResolvedValue(doc);
      deps.documentRepository.archive.mockResolvedValue(archivedDoc);

      // Act
      await service.archive({ ...archiveInput, requestingUserId: 'admin-7' });

      // Assert
      expect(deps.eventBus.publish).toHaveBeenCalledWith('document.archived', {
        documentId: archivedDoc.id,
        organizationId: archivedDoc.organizationId,
        fileName: archivedDoc.fileName,
        type: archivedDoc.type,
        entityType: archivedDoc.entityType,
        entityId: archivedDoc.entityId,
        requestingUserId: 'admin-7',
      });
    });

    it('publishes document.archived event with null requestingUserId when missing', async () => {
      // Arrange
      const doc = makeDocument();
      const archivedDoc = makeDocument({ isArchived: true });
      deps.documentRepository.findById.mockResolvedValue(doc);
      deps.documentRepository.archive.mockResolvedValue(archivedDoc);

      // Act
      await service.archive(archiveInput);

      // Assert
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'document.archived',
        expect.objectContaining({ requestingUserId: null }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // bulkDownload
  // -----------------------------------------------------------------------

  describe('bulkDownload', () => {
    it('reports missing documents in errors array', async () => {
      // Arrange
      deps.documentRepository.findManyByIds.mockResolvedValue([]);

      // Act
      const result = await service.bulkDownload({
        organizationId: 'org-1',
        documentIds: ['missing-1', 'missing-2'],
      });

      // Assert
      expect(result.downloads).toHaveLength(0);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          { documentId: 'missing-1', reason: 'Document not found' },
          { documentId: 'missing-2', reason: 'Document not found' },
        ]),
      );
    });

    it('skips archived and unconfirmed documents', async () => {
      // Arrange
      const archivedDoc = makeDocument({ id: 'doc-archived', isArchived: true });
      const pendingDoc = makeDocument({
        id: 'doc-pending',
        uploadStatus: UPLOAD_STATUS.PENDING,
        isArchived: false,
      });
      deps.documentRepository.findManyByIds.mockResolvedValue([archivedDoc, pendingDoc]);

      // Act
      const result = await service.bulkDownload({
        organizationId: 'org-1',
        documentIds: ['doc-archived', 'doc-pending'],
      });

      // Assert
      expect(result.downloads).toHaveLength(0);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          { documentId: 'doc-archived', reason: 'Document is archived' },
          { documentId: 'doc-pending', reason: 'Document upload not confirmed' },
        ]),
      );
      expect(deps.storageProvider.getPresignedGetUrl).not.toHaveBeenCalled();
    });

    it('handles mixed valid and invalid documents', async () => {
      // Arrange
      const validDoc = makeDocument({
        id: 'doc-valid',
        uploadStatus: UPLOAD_STATUS.CONFIRMED,
        isArchived: false,
        fileName: 'valid.pdf',
        s3Key: 'org-1/loads/load-1/bol_signed/valid.pdf',
      });
      const archivedDoc = makeDocument({ id: 'doc-archived', isArchived: true });
      deps.documentRepository.findManyByIds.mockResolvedValue([validDoc, archivedDoc]);
      deps.storageProvider.getPresignedGetUrl.mockResolvedValue(
        'https://s3.example.com/download-url',
      );

      // Act
      const result = await service.bulkDownload({
        organizationId: 'org-1',
        documentIds: ['doc-valid', 'doc-archived', 'doc-missing'],
      });

      // Assert
      expect(result.downloads).toEqual([
        {
          documentId: 'doc-valid',
          fileName: 'valid.pdf',
          presignedUrl: 'https://s3.example.com/download-url',
        },
      ]);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          { documentId: 'doc-archived', reason: 'Document is archived' },
          { documentId: 'doc-missing', reason: 'Document not found' },
        ]),
      );
    });
  });

  // -----------------------------------------------------------------------
  // list
  // -----------------------------------------------------------------------

  describe('list', () => {
    it('delegates to repository findMany with org scoping', async () => {
      // Arrange
      const input = {
        organizationId: 'org-1',
        entityType: 'load' as const,
        entityId: 'load-1',
      };
      const docs = [makeDocument(), makeDocument({ id: 'doc-2' })];
      deps.documentRepository.findMany.mockResolvedValue(docs);

      // Act
      const result = await service.list(input);

      // Assert
      expect(deps.documentRepository.findMany).toHaveBeenCalledWith(input);
      expect(result).toEqual(docs);
    });
  });
});
