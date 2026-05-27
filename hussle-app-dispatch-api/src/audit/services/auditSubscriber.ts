import type { EventBus } from '../../shared/messaging/eventBus';
import type { CreateAuditLogInput } from '../types/auditTypes';
import type { Logger } from '../../shared/utils/logger';

interface AuditLogCreatePort {
  create(organizationId: string, input: CreateAuditLogInput): Promise<unknown>;
}

interface AuditSubscriberDeps {
  eventBus: EventBus;
  auditLogRepo: AuditLogCreatePort;
  logger: Logger;
}

/**
 * Subscribes to domain events on the EventBus to create audit log entries.
 * - 'organization.created' -> audit log for signup
 */
export const initializeAuditSubscriber = async (
  deps: AuditSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('organization.created', 'audit-service', async (data) => {
    try {
      await deps.auditLogRepo.create(data.orgId, {
        userId: data.userId,
        action: 'CREATE',
        entityType: 'User',
        entityId: data.userId,
        changes: null,
        metadata: {
          email: data.userEmail,
          organizationName: data.orgName,
          action: 'signup',
        },
      });

      deps.logger.info('Audit log created for organization signup', {
        orgId: data.orgId,
        userId: data.userId,
      });
    } catch (error: unknown) {
      deps.logger.error('Failed to create audit log for organization signup', {
        orgId: data.orgId,
        userId: data.userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await deps.eventBus.subscribe('invitation.created', 'audit-service', async (data) => {
    try {
      await deps.auditLogRepo.create(data.organizationId, {
        userId: null,
        action: 'INVITE_SENT',
        entityType: 'Invitation',
        entityId: data.inviteId,
        changes: null,
        metadata: {
          recipientEmail: data.recipientEmail,
          role: data.role,
          inviterName: data.inviterName,
        },
      });
    } catch (error: unknown) {
      deps.logger.error('Failed to create audit log for invite sent', {
        inviteId: data.inviteId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await deps.eventBus.subscribe('document.archived', 'audit-service', async (data) => {
    try {
      await deps.auditLogRepo.create(data.organizationId, {
        userId: data.requestingUserId ?? null,
        action: 'DOCUMENT_ARCHIVED',
        entityType: 'Document',
        entityId: data.documentId,
        changes: null,
        metadata: {
          fileName: data.fileName,
          type: data.type,
          entityType: data.entityType,
          entityId: data.entityId,
        },
      });
    } catch (error: unknown) {
      deps.logger.error('Failed to create audit log for document.archived', {
        documentId: data.documentId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await deps.eventBus.subscribe('document.replaced', 'audit-service', async (data) => {
    try {
      await deps.auditLogRepo.create(data.organizationId, {
        userId: data.requestingUserId ?? null,
        action: 'DOCUMENT_REPLACED',
        entityType: 'Document',
        entityId: data.priorDocumentId,
        changes: null,
        metadata: {
          replacedBy: data.replacedBy,
          priorS3Key: data.priorS3Key,
          type: data.documentType,
          entityType: data.entityType,
          entityId: data.entityId,
        },
      });
    } catch (error: unknown) {
      deps.logger.error('Failed to create audit log for document.replaced', {
        priorDocumentId: data.priorDocumentId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  deps.logger.info('Audit subscriber initialized');
};
