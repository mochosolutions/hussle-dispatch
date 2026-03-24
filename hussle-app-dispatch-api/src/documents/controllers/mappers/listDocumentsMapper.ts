import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';
import type { DocumentEntityType, ListDocumentsInput } from '../../types/documentTypes';

export const listDocumentsMapper = (req: Request): ListDocumentsInput => {
  const organizationId = req.organizationId;
  if (organizationId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const query = req.query as {
    entityType?: DocumentEntityType;
    entityId?: string;
    type?: string;
    expiringBefore?: string;
    includeArchived?: string;
  };

  return {
    organizationId,
    entityType: query.entityType,
    entityId: query.entityId,
    type: query.type,
    expiringBefore: query.expiringBefore ? new Date(query.expiringBefore) : undefined,
    includeArchived: query.includeArchived === 'true',
  };
};
