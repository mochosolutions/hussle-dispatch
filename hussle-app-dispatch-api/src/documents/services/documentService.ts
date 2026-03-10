import type { StorageProvider } from '@/shared/storage';
import type { DocumentRepoPort, PresignInput, PresignResult, ListDocumentsInput } from '../types/documentTypes';
import type { DocumentService } from '../types/documentServiceTypes';
import type { ConfirmInput } from '../types/documentTypes';
import type { Document } from '@prisma/client';
import {
  DocumentNotFoundError,
  DocumentUploadNotConfirmedError,
  DocumentAlreadyConfirmedError,
  DocumentMissingAssociationError,
} from '../types/documentErrors';
import { PRESIGN_EXPIRATION_SECONDS, UPLOAD_STATUS } from '../types/documentTypes';

interface DocumentServiceDeps {
  documentRepository: DocumentRepoPort;
  storageProvider: StorageProvider;
}

/**
 * Builds the storage key path based on entity association.
 *
 * Pattern:
 *   {orgId}/loads/{loadId}/{type}/{fileName}
 *   {orgId}/carriers/{carrierId}/{type}/{fileName}
 */
const buildStorageKey = (input: PresignInput): string => {
  const typeLower = input.type.toLowerCase();

  if (input.loadId !== undefined) {
    return `${input.organizationId}/loads/${input.loadId}/${typeLower}/${input.fileName}`;
  }

  if (input.carrierId !== undefined) {
    return `${input.organizationId}/carriers/${input.carrierId}/${typeLower}/${input.fileName}`;
  }

  return `${input.organizationId}/general/${typeLower}/${input.fileName}`;
};

/**
 * Maps a document type to the corresponding load timestamp field, if any.
 */
const getLoadTimestampField = (
  docType: string,
): 'rateConReceivedAt' | 'bolUnsignedAt' | 'bolSignedAt' | null => {
  if (docType === 'BROKER_RATE_CON') {
    return 'rateConReceivedAt';
  }
  if (docType === 'BOL_UNSIGNED') {
    return 'bolUnsignedAt';
  }
  if (docType === 'BOL_SIGNED') {
    return 'bolSignedAt';
  }
  return null;
};

export const createDocumentService = (deps: DocumentServiceDeps): DocumentService => ({
  presign: async (input: PresignInput): Promise<PresignResult> => {
    if (input.loadId === undefined && input.carrierId === undefined) {
      throw new DocumentMissingAssociationError();
    }

    const s3Key = buildStorageKey(input);
    const presignedUrl = await deps.storageProvider.getPresignedPutUrl(
      s3Key,
      input.mimeType,
      PRESIGN_EXPIRATION_SECONDS,
    );

    const document = await deps.documentRepository.create({
      organizationId: input.organizationId,
      loadId: input.loadId,
      carrierId: input.carrierId,
      type: input.type,
      fileName: input.fileName,
      mimeType: input.mimeType,
      s3Key,
      s3Url: presignedUrl,
      uploadStatus: UPLOAD_STATUS.PENDING,
      uploadedByUserId: input.uploadedByUserId,
    });

    return {
      documentId: document.id,
      presignedUrl,
      expiresIn: PRESIGN_EXPIRATION_SECONDS,
    };
  },

  confirm: async (input: ConfirmInput): Promise<Document> => {
    const document = await deps.documentRepository.findById(
      input.documentId,
      input.organizationId,
    );

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

    // Update status to confirmed
    const confirmed = await deps.documentRepository.updateUploadStatus(
      input.documentId,
      UPLOAD_STATUS.CONFIRMED,
    );

    // Side effects by document type
    const now = new Date();

    // Archive previous rate con if a new one is confirmed
    if (document.type === 'BROKER_RATE_CON' && document.loadId !== null) {
      await deps.documentRepository.archiveByLoadAndType(
        document.loadId,
        document.type,
        document.id,
      );
    }

    // Update load timestamps for specific document types
    const timestampField = getLoadTimestampField(document.type);
    if (timestampField !== null && document.loadId !== null) {
      await deps.documentRepository.updateLoadTimestamp(
        document.loadId,
        timestampField,
        now,
      );
    }

    return confirmed;
  },

  list: async (input: ListDocumentsInput): Promise<Document[]> =>
    deps.documentRepository.findMany(input),
});
