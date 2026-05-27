import type { DocumentService } from '@/documents/types/documentServiceTypes';
import type {
  DocumentWithUploader,
  PresignResult,
} from '@/documents/types/documentTypes';
import type {
  PortalDocument,
  PortalDocumentRepoPort,
} from '../../types/portalDocumentsTypes';
import { NotFoundError } from '@/shared/errors/commonErrors';
import { createPortalDocumentsService } from '../portalDocumentsService';

const CARRIER_ID = 'd73084dd-d6e7-4b79-af2b-63d17b4f4349';
const ORG_ID = '11111111-1111-1111-1111-111111111111';
const DOCUMENT_ID = '22222222-2222-2222-2222-222222222222';

const buildDocumentRepo = (
  overrides: Partial<PortalDocumentRepoPort> = {},
): PortalDocumentRepoPort => ({
  listByCarrier: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  findById: jest.fn().mockResolvedValue(null),
  findByIdAndCarrier: jest.fn().mockResolvedValue(null),
  updateStatus: jest.fn(),
  ...overrides,
});

const buildDocumentService = (
  overrides: Partial<DocumentService> = {},
): DocumentService =>
  ({
    presign: jest.fn(),
    confirm: jest.fn(),
    list: jest.fn(),
    getById: jest.fn(),
    getDownloadUrl: jest.fn(),
    archive: jest.fn(),
    bulkDownload: jest.fn(),
    ...overrides,
  }) as DocumentService;

const presignResult: PresignResult = {
  documentId: DOCUMENT_ID,
  presignedUrl: 'https://s3.example/upload',
  expiresIn: 900,
};

const confirmedDocument: DocumentWithUploader = {
  id: DOCUMENT_ID,
  organizationId: ORG_ID,
  entityType: 'carrier',
  entityId: CARRIER_ID,
  type: 'INSURANCE_CERTIFICATE',
  fileName: 'cert.pdf',
  mimeType: 'application/pdf',
  s3Key: 'orgs/carriers/.../cert.pdf',
  url: 'https://s3.example/cert.pdf',
  uploadStatus: 'CONFIRMED',
  reviewStatus: null,
  uploadedByUserId: null,
  fileSize: 1024,
  isArchived: false,
  expiresAt: null,
  metadata: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  uploadedByUser: null,
} as unknown as DocumentWithUploader;

const ownedDocument: PortalDocument = {
  id: DOCUMENT_ID,
  documentType: 'INSURANCE_CERTIFICATE',
  fileName: 'cert.pdf',
  fileUrl: 'https://s3.example/cert.pdf',
  reviewStatus: null,
  signatureData: null,
  signedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('portalDocumentsService', () => {
  describe('presignDocument', () => {
    it('forwards expiresAt to documentService.presign when supplied', async () => {
      // Arrange
      const documentService = buildDocumentService({
        presign: jest.fn().mockResolvedValue(presignResult),
      });
      const service = createPortalDocumentsService({
        documentRepo: buildDocumentRepo(),
        documentService,
      });

      // Act
      await service.presignDocument(CARRIER_ID, ORG_ID, {
        fileName: 'cert.pdf',
        contentType: 'application/pdf',
        documentType: 'INSURANCE_CERTIFICATE',
        expiresAt: '2027-01-01',
      });

      // Assert
      expect(documentService.presign).toHaveBeenCalledWith(
        expect.objectContaining({ expiresAt: '2027-01-01' }),
      );
    });

    it('forwards metadata to documentService.presign when supplied', async () => {
      const documentService = buildDocumentService({
        presign: jest.fn().mockResolvedValue(presignResult),
      });
      const service = createPortalDocumentsService({
        documentRepo: buildDocumentRepo(),
        documentService,
      });

      const metadata = { policyNumber: 'POL-123' };
      await service.presignDocument(CARRIER_ID, ORG_ID, {
        fileName: 'cert.pdf',
        contentType: 'application/pdf',
        documentType: 'INSURANCE_CERTIFICATE',
        metadata,
      });

      expect(documentService.presign).toHaveBeenCalledWith(
        expect.objectContaining({ metadata }),
      );
    });

    it('omits uploadedByUserId for portal context', async () => {
      const presignMock = jest.fn().mockResolvedValue(presignResult);
      const documentService = buildDocumentService({ presign: presignMock });
      const service = createPortalDocumentsService({
        documentRepo: buildDocumentRepo(),
        documentService,
      });

      await service.presignDocument(CARRIER_ID, ORG_ID, {
        fileName: 'cert.pdf',
        contentType: 'application/pdf',
        documentType: 'INSURANCE_CERTIFICATE',
      });

      const [callArg] = presignMock.mock.calls[0] as [
        { uploadedByUserId?: string | null },
      ];
      expect(callArg.uploadedByUserId).toBeUndefined();
    });

    it('translates dispatcher result back to v2 client shape', async () => {
      const documentService = buildDocumentService({
        presign: jest.fn().mockResolvedValue(presignResult),
      });
      const service = createPortalDocumentsService({
        documentRepo: buildDocumentRepo(),
        documentService,
      });

      const result = await service.presignDocument(CARRIER_ID, ORG_ID, {
        fileName: 'cert.pdf',
        contentType: 'application/pdf',
        documentType: 'INSURANCE_CERTIFICATE',
      });

      expect(result).toEqual({
        documentId: DOCUMENT_ID,
        uploadUrl: 'https://s3.example/upload',
        fields: {},
      });
    });

    it('maps entityType to carrier and entityId to carrierId', async () => {
      const presignMock = jest.fn().mockResolvedValue(presignResult);
      const documentService = buildDocumentService({ presign: presignMock });
      const service = createPortalDocumentsService({
        documentRepo: buildDocumentRepo(),
        documentService,
      });

      await service.presignDocument(CARRIER_ID, ORG_ID, {
        fileName: 'cert.pdf',
        contentType: 'application/pdf',
        documentType: 'INSURANCE_CERTIFICATE',
      });

      expect(presignMock).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_ID,
          entityType: 'carrier',
          entityId: CARRIER_ID,
          fileName: 'cert.pdf',
          mimeType: 'application/pdf',
          type: 'INSURANCE_CERTIFICATE',
        }),
      );
    });
  });

  describe('confirmDocument', () => {
    it('gates on findByIdAndCarrier and delegates to documentService.confirm on success', async () => {
      // Arrange
      const findByIdAndCarrier = jest.fn().mockResolvedValue(ownedDocument);
      const confirmMock = jest.fn().mockResolvedValue(confirmedDocument);
      const documentRepo = buildDocumentRepo({ findByIdAndCarrier });
      const documentService = buildDocumentService({ confirm: confirmMock });
      const service = createPortalDocumentsService({
        documentRepo,
        documentService,
      });

      // Act
      await service.confirmDocument(DOCUMENT_ID, CARRIER_ID, ORG_ID, {});

      // Assert
      expect(findByIdAndCarrier).toHaveBeenCalledWith(
        DOCUMENT_ID,
        CARRIER_ID,
        ORG_ID,
      );
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: DOCUMENT_ID,
          organizationId: ORG_ID,
        }),
      );
    });

    it('throws NotFoundError when document is not owned by carrier', async () => {
      const documentRepo = buildDocumentRepo({
        findByIdAndCarrier: jest.fn().mockResolvedValue(null),
      });
      const documentService = buildDocumentService();
      const service = createPortalDocumentsService({
        documentRepo,
        documentService,
      });

      await expect(
        service.confirmDocument(DOCUMENT_ID, CARRIER_ID, ORG_ID, {}),
      ).rejects.toThrow(NotFoundError);
    });

    it('does not call documentService.confirm when ownership check fails', async () => {
      const confirmMock = jest.fn();
      const documentRepo = buildDocumentRepo({
        findByIdAndCarrier: jest.fn().mockResolvedValue(null),
      });
      const documentService = buildDocumentService({ confirm: confirmMock });
      const service = createPortalDocumentsService({
        documentRepo,
        documentService,
      });

      await expect(
        service.confirmDocument(DOCUMENT_ID, CARRIER_ID, ORG_ID, {}),
      ).rejects.toThrow(NotFoundError);

      expect(confirmMock).not.toHaveBeenCalled();
    });

    it('forwards expiresAt and metadata into documentService.confirm', async () => {
      const confirmMock = jest.fn().mockResolvedValue(confirmedDocument);
      const documentRepo = buildDocumentRepo({
        findByIdAndCarrier: jest.fn().mockResolvedValue(ownedDocument),
      });
      const documentService = buildDocumentService({ confirm: confirmMock });
      const service = createPortalDocumentsService({
        documentRepo,
        documentService,
      });

      const metadata = { reviewedBy: 'system' };
      await service.confirmDocument(DOCUMENT_ID, CARRIER_ID, ORG_ID, {
        expiresAt: '2027-06-01',
        metadata,
      });

      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: DOCUMENT_ID,
          organizationId: ORG_ID,
          expiresAt: '2027-06-01',
          metadata,
        }),
      );
    });

    it('returns a portal-shaped document from the confirmed dispatcher result', async () => {
      const documentRepo = buildDocumentRepo({
        findByIdAndCarrier: jest.fn().mockResolvedValue(ownedDocument),
      });
      const documentService = buildDocumentService({
        confirm: jest.fn().mockResolvedValue(confirmedDocument),
      });
      const service = createPortalDocumentsService({
        documentRepo,
        documentService,
      });

      const result = await service.confirmDocument(
        DOCUMENT_ID,
        CARRIER_ID,
        ORG_ID,
        {},
      );

      expect(result).toEqual({
        id: DOCUMENT_ID,
        documentType: 'INSURANCE_CERTIFICATE',
        fileName: 'cert.pdf',
        fileUrl: 'https://s3.example/cert.pdf',
        reviewStatus: null,
        signatureData: null,
        signedAt: null,
        createdAt: confirmedDocument.createdAt,
      });
    });
  });
});
