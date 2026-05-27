import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors/commonErrors';

interface CarrierContext {
  carrierId: string;
  organizationId: string;
}

const getCarrierContext = (req: Request): CarrierContext => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return {
    carrierId: req.carrierPortal.carrierId,
    organizationId: req.carrierPortal.organizationId,
  };
};

export interface ListDocumentsInput {
  carrierId: string;
  organizationId: string;
}

export const listDocumentsMapper = (req: Request): ListDocumentsInput => {
  const { carrierId, organizationId } = getCarrierContext(req);
  return { carrierId, organizationId };
};

export interface PresignDocumentInput {
  carrierId: string;
  organizationId: string;
  fileName: string;
  contentType: string;
  documentType: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export const presignDocumentMapper = (req: Request): PresignDocumentInput => {
  const { carrierId, organizationId } = getCarrierContext(req);
  return {
    carrierId,
    organizationId,
    fileName: req.body.fileName,
    // Wire-format uses `mimeType` and `type` (UI v2 contract). The service
    // input keeps the older field names; bridge them here.
    contentType: req.body.mimeType,
    documentType: req.body.type,
    expiresAt: req.body.expiresAt,
    metadata: req.body.metadata,
  };
};

export interface ConfirmDocumentInput {
  documentId: string;
  carrierId: string;
  organizationId: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export const confirmDocumentMapper = (req: Request): ConfirmDocumentInput => {
  const { carrierId, organizationId } = getCarrierContext(req);
  return {
    documentId: req.params.id ?? '',
    carrierId,
    organizationId,
    expiresAt: req.body.expiresAt,
    metadata: req.body.metadata,
  };
};
