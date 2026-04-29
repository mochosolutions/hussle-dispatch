import { basename } from 'path';
import type { Prisma } from '@prisma/client';
import type { StorageProvider } from '@/shared/storage';
import type { EventBus } from '@/shared/messaging';
import type {
  ArchiveDocumentInput,
  BulkDownloadInput,
  BulkDownloadResult,
  ConfirmInput,
  DocumentRepoPort,
  DocumentWithUploader,
  DownloadDocumentInput,
  GetDocumentInput,
  ListDocumentsInput,
  LoadContactQueryPort,
  PresignInput,
  PresignResult,
} from '../types/documentTypes';
import type { DocumentService } from '../types/documentServiceTypes';
import {
  DocumentNotFoundError,
  DocumentUploadNotConfirmedError,
  DocumentAlreadyConfirmedError,
} from '../types/documentErrors';
import { MAX_FILE_SIZES, PRESIGN_EXPIRATION_SECONDS, UPLOAD_STATUS } from '../types/documentTypes';
import { ValidationError } from '@/shared/errors/commonErrors';

interface DocumentServiceDeps {
  documentRepository: DocumentRepoPort;
  storageProvider: StorageProvider;
  eventBus: EventBus;
  loadContactQuery?: LoadContactQueryPort;
}

/**
 * Builds the storage key path for a document.
 *
 * Pattern: {orgId}/{entityType}s/{entityId}/{type}/{fileName}
 */
const buildStorageKey = (input: PresignInput): string => {
  const typeLower = input.type.toLowerCase();
  const safeFileName = basename(input.fileName);
  return `${input.organizationId}/${input.entityType}s/${input.entityId}/${typeLower}/${safeFileName}`;
};

export const createDocumentService = (deps: DocumentServiceDeps): DocumentService => ({
  presign: async (input: PresignInput): Promise<PresignResult> => {
    const s3Key = buildStorageKey(input);

    if (input.fileSize !== undefined) {
      const maxSize = MAX_FILE_SIZES[input.mimeType];
      if (maxSize !== undefined && input.fileSize > maxSize) {
        const limitMb = maxSize / (1024 * 1024);
        throw new ValidationError(`File size exceeds the ${limitMb}MB limit for ${input.mimeType}`);
      }
    }

    const presignedUrl = await deps.storageProvider.getPresignedPutUrl(
      s3Key,
      input.mimeType,
      PRESIGN_EXPIRATION_SECONDS,
    );

    const document = await deps.documentRepository.create({
      organizationId: input.organizationId,
      entityType: input.entityType,
      entityId: input.entityId,
      type: input.type,
      fileName: input.fileName,
      mimeType: input.mimeType,
      s3Key,
      url: presignedUrl,
      uploadStatus: UPLOAD_STATUS.PENDING,
      uploadedByUserId: input.uploadedByUserId,
      ...(input.expiresAt !== undefined && { expiresAt: new Date(input.expiresAt) }),
      ...(input.metadata !== undefined && {
        metadata: input.metadata as unknown as Prisma.InputJsonValue,
      }),
    });

    return {
      documentId: document.id,
      presignedUrl,
      expiresIn: PRESIGN_EXPIRATION_SECONDS,
    };
  },

  confirm: async (input: ConfirmInput): Promise<DocumentWithUploader> => {
    const document = await deps.documentRepository.findById(input.documentId, input.organizationId);

    if (document === null) {
      throw new DocumentNotFoundError(input.documentId);
    }

    if (document.uploadStatus === UPLOAD_STATUS.CONFIRMED) {
      throw new DocumentAlreadyConfirmedError(input.documentId);
    }

    // Verify the file actually exists in storage
    const fileExists = await deps.storageProvider.exists(document.s3Key);
    if (!fileExists) {
      throw new DocumentUploadNotConfirmedError(input.documentId);
    }

    // Validate uploaded file size against per-mime-type limits
    if (document.mimeType !== null) {
      const maxSize = MAX_FILE_SIZES[document.mimeType];
      if (maxSize !== undefined) {
        const metadata = await deps.storageProvider.getMetadata(document.s3Key);
        if (metadata.size > maxSize) {
          await deps.storageProvider.delete(document.s3Key);
          const limitMb = maxSize / (1024 * 1024);
          throw new ValidationError(
            `Uploaded file exceeds the ${limitMb}MB limit for ${document.mimeType}`,
          );
        }
      }
    }

    // Update status to confirmed
    const confirmed = await deps.documentRepository.updateUploadStatus(
      input.documentId,
      UPLOAD_STATUS.CONFIRMED,
    );

    // Look up load context for notification enrichment
    let enrichedFields: {
      loadId?: string;
      customerId?: string | null;
      loadNumber?: string;
      contactEmail?: string | null;
      contactPhone?: string | null;
      contactCcEmails?: string[];
    } = {};

    if (document.entityType === 'load' && deps.loadContactQuery !== undefined) {
      const load = await deps.loadContactQuery.findById(document.entityId);
      if (load !== null) {
        enrichedFields = {
          loadId: load.id,
          customerId: load.customerId,
          loadNumber: load.loadNumber,
          contactEmail: load.contactEmail,
          contactPhone: load.contactPhone,
          contactCcEmails: load.contactCcEmails,
        };
      }
    }

    // Publish event — archiving logic is handled by the subscriber
    await deps.eventBus.publish('document.confirmed', {
      documentId: document.id,
      entityType: document.entityType,
      entityId: document.entityId,
      documentType: document.type,
      organizationId: document.organizationId,
      requestingUserId: input.requestingUserId ?? null,
      ...enrichedFields,
    });

    return confirmed;
  },

  list: async (input: ListDocumentsInput): Promise<DocumentWithUploader[]> =>
    deps.documentRepository.findMany(input),

  getById: async (input: GetDocumentInput): Promise<DocumentWithUploader> => {
    const document = await deps.documentRepository.findById(input.id, input.organizationId);

    if (document === null) {
      throw new DocumentNotFoundError(input.id);
    }

    return document;
  },

  getDownloadUrl: async (input: DownloadDocumentInput): Promise<string> => {
    const document = await deps.documentRepository.findById(input.id, input.organizationId);

    if (document === null) {
      throw new DocumentNotFoundError(input.id);
    }

    if (document.uploadStatus !== UPLOAD_STATUS.CONFIRMED) {
      throw new DocumentUploadNotConfirmedError(input.id);
    }

    const presignedUrl = await deps.storageProvider.getPresignedGetUrl(
      document.s3Key,
      PRESIGN_EXPIRATION_SECONDS,
    );

    return presignedUrl;
  },

  archive: async (input: ArchiveDocumentInput): Promise<DocumentWithUploader> => {
    const document = await deps.documentRepository.findById(input.id, input.organizationId);

    if (document === null) {
      throw new DocumentNotFoundError(input.id);
    }

    const archived = await deps.documentRepository.archive(input.id);

    await deps.eventBus.publish('document.archived', {
      documentId: archived.id,
      organizationId: archived.organizationId,
      fileName: archived.fileName,
      type: archived.type,
      entityType: archived.entityType,
      entityId: archived.entityId,
      requestingUserId: input.requestingUserId ?? null,
    });

    return archived;
  },

  bulkDownload: async (input: BulkDownloadInput): Promise<BulkDownloadResult> => {
    const documents = await deps.documentRepository.findManyByIds(
      input.documentIds,
      input.organizationId,
    );

    const foundIds = new Set(documents.map((doc) => doc.id));
    const downloads: BulkDownloadResult['downloads'] = [];
    const errors: BulkDownloadResult['errors'] = [];

    // Report missing documents
    input.documentIds.forEach((docId) => {
      if (!foundIds.has(docId)) {
        errors.push({ documentId: docId, reason: 'Document not found' });
      }
    });

    // Process found documents
    const urlPromises = documents.map(async (doc) => {
      if (doc.isArchived) {
        errors.push({ documentId: doc.id, reason: 'Document is archived' });
        return;
      }

      if (doc.uploadStatus !== UPLOAD_STATUS.CONFIRMED) {
        errors.push({ documentId: doc.id, reason: 'Document upload not confirmed' });
        return;
      }

      const presignedUrl = await deps.storageProvider.getPresignedGetUrl(
        doc.s3Key,
        PRESIGN_EXPIRATION_SECONDS,
      );

      downloads.push({
        documentId: doc.id,
        fileName: doc.fileName,
        presignedUrl,
      });
    });

    await Promise.all(urlPromises);

    return { downloads, errors };
  },
});
