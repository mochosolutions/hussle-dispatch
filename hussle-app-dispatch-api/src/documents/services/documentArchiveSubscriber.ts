import type { DocumentType } from '@prisma/client';
import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { DocumentRepoPort } from '../types/documentTypes';
import { ONE_PER_DOCUMENT_TYPES } from '../types/documentTypes';

interface DocumentArchiveSubscriberDeps {
  eventBus: EventBus;
  documentRepository: DocumentRepoPort;
  logger: Logger;
}

/**
 * Subscribes to 'document.confirmed' events and, when the confirmed document
 * is one of the "one-per" types, archives any prior active documents of the
 * same type for the same entity. Publishes 'document.replaced' for each
 * superseded row so downstream consumers (audit, cleanup) can react.
 */
export const createDocumentArchiveSubscriber = async (
  deps: DocumentArchiveSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('document.confirmed', 'document-archive-service', async (data) => {
    const documentType = data.documentType as DocumentType;

    if (!ONE_PER_DOCUMENT_TYPES.has(documentType)) {
      return;
    }

    try {
      const superseded = await deps.documentRepository.archiveByEntityAndType(
        data.entityType,
        data.entityId,
        documentType,
        data.documentId,
      );

      await Promise.all(
        superseded.map((row) =>
          deps.eventBus.publish('document.replaced', {
            priorDocumentId: row.id,
            priorS3Key: row.s3Key,
            replacedBy: data.documentId,
            entityType: data.entityType,
            entityId: data.entityId,
            organizationId: data.organizationId,
            documentType: data.documentType,
            requestingUserId: data.requestingUserId ?? null,
          }),
        ),
      );
    } catch (error: unknown) {
      deps.logger.error('Failed to archive prior documents on document.confirmed', {
        documentId: data.documentId,
        entityId: data.entityId,
        documentType: data.documentType,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  deps.logger.info('Document archive subscriber initialized');
};
