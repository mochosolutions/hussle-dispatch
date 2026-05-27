import type {
  PortalDocument,
  PortalDocumentRepoPort,
} from '../types/portalDocumentsTypes';
import type { DocumentService } from '@/documents/types/documentServiceTypes';
import type {
  DocumentType,
  DocumentMetadata,
  DocumentWithUploader,
} from '@/documents/types/documentTypes';
import { NotFoundError } from '@/shared/errors/commonErrors';

interface PortalDocumentsServiceDeps {
  documentRepo: PortalDocumentRepoPort;
  documentService: DocumentService;
}

interface PresignInput {
  fileName: string;
  contentType: string;
  documentType: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

interface PresignResult {
  documentId: string;
  uploadUrl: string;
  fields: Record<string, string>;
}

interface ConfirmInput {
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Re-shape a confirmed dispatcher document into the portal document wire shape.
 * The portal transformer only needs a subset of fields; signature data is N/A
 * for portal uploads.
 */
const toPortalDocument = (doc: DocumentWithUploader): PortalDocument => ({
  id: doc.id,
  documentType: doc.type,
  fileName: doc.fileName,
  fileUrl: doc.url ?? '',
  reviewStatus: doc.reviewStatus ?? null,
  signatureData: null,
  signedAt: null,
  createdAt: doc.createdAt,
});

export const createPortalDocumentsService = (deps: PortalDocumentsServiceDeps) => ({
  listDocuments: async (
    carrierId: string,
    organizationId: string,
  ): Promise<PortalDocument[]> => deps.documentRepo.listByCarrier(carrierId, organizationId),

  presignDocument: async (
    carrierId: string,
    organizationId: string,
    input: PresignInput,
  ): Promise<PresignResult> => {
    const result = await deps.documentService.presign({
      organizationId,
      entityType: 'carrier',
      entityId: carrierId,
      fileName: input.fileName,
      mimeType: input.contentType,
      type: input.documentType as DocumentType,
      // Portals authenticate via invite token — no User row to attribute to.
      uploadedByUserId: undefined,
      ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
      ...(input.metadata !== undefined && {
        metadata: input.metadata as DocumentMetadata,
      }),
    });

    return {
      documentId: result.documentId,
      uploadUrl: result.presignedUrl,
      fields: {},
    };
  },

  confirmDocument: async (
    documentId: string,
    carrierId: string,
    organizationId: string,
    input: ConfirmInput,
  ): Promise<PortalDocument> => {
    // Verify the document belongs to this carrier (token scope) before
    // delegating the confirm flow to the dispatcher service.
    const ownership = await deps.documentRepo.findByIdAndCarrier(
      documentId,
      carrierId,
      organizationId,
    );
    if (!ownership) {
      throw new NotFoundError(`Document with id ${documentId} not found`);
    }

    const confirmed = await deps.documentService.confirm({
      documentId,
      organizationId,
      ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
      ...(input.metadata !== undefined && {
        metadata: input.metadata as DocumentMetadata,
      }),
    });

    return toPortalDocument(confirmed);
  },
});
