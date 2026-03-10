import type { Request } from 'express';
import type { DocumentType } from '@prisma/client';
import { UnauthorizedError } from '@/shared/errors';
import type { ListDocumentsInput } from '../../types/documentTypes';

export const listDocumentsMapper = (req: Request): ListDocumentsInput => {
  const organizationId = req.organizationId;
  if (organizationId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const query = req.query as {
    loadId?: string;
    carrierId?: string;
    type?: DocumentType;
    includeArchived?: string;
  };

  return {
    organizationId,
    loadId: query.loadId,
    carrierId: query.carrierId,
    type: query.type,
    includeArchived: query.includeArchived === 'true',
  };
};
