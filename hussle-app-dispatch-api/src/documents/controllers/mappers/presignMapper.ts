import type { Request } from 'express';
import type { DocumentType } from '@prisma/client';
import { UnauthorizedError } from '@/shared/errors';
import type { PresignInput } from '../../types/documentTypes';

export const presignMapper = (req: Request): PresignInput => {
  const organizationId = req.organizationId;
  if (organizationId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const body = req.body as {
    fileName: string;
    mimeType: string;
    type: DocumentType;
    loadId?: string;
    carrierId?: string;
  };

  return {
    organizationId,
    fileName: body.fileName,
    mimeType: body.mimeType,
    type: body.type,
    loadId: body.loadId,
    carrierId: body.carrierId,
    uploadedByUserId: req.user?.userId,
  };
};
