import type { Request } from 'express';
import type { DocumentType } from '@prisma/client';
import type {
  DocumentEntityType,
  DocumentMetadata,
  PresignInput,
} from '../../types/documentTypes';

export const presignMapper = (req: Request): PresignInput => {
  const body = req.body as {
    fileName: string;
    mimeType: string;
    type: DocumentType;
    entityType: DocumentEntityType;
    entityId: string;
    expiresAt?: string;
    metadata?: DocumentMetadata;
    fileSize?: number;
  };

  return {
    organizationId: req.organizationId ?? '',
    fileName: body.fileName,
    mimeType: body.mimeType,
    type: body.type,
    entityType: body.entityType,
    entityId: body.entityId,
    uploadedByUserId: req.user?.userId,
    expiresAt: body.expiresAt,
    metadata: body.metadata,
    fileSize: body.fileSize,
  };
};
