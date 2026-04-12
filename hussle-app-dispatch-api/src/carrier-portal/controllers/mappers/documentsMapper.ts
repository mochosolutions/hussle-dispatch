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
}

export const presignDocumentMapper = (req: Request): PresignDocumentInput => {
  const { carrierId, organizationId } = getCarrierContext(req);
  return {
    carrierId,
    organizationId,
    fileName: req.body.fileName,
    contentType: req.body.contentType,
    documentType: req.body.documentType,
  };
};

export interface ConfirmDocumentInput {
  documentId: string;
  carrierId: string;
  organizationId: string;
  documentType: string;
  insuranceExpiry?: string;
  coverageConfirmed?: boolean;
}

export const confirmDocumentMapper = (req: Request): ConfirmDocumentInput => {
  const { carrierId, organizationId } = getCarrierContext(req);
  return {
    documentId: req.params.id ?? '',
    carrierId,
    organizationId,
    documentType: req.body.documentType,
    insuranceExpiry: req.body.insuranceExpiry,
    coverageConfirmed: req.body.coverageConfirmed,
  };
};

export interface SignDocumentInput {
  documentId: string;
  carrierId: string;
  organizationId: string;
  signatureData: string;
  consentGiven: boolean;
  signerName?: string;
  signerTitle?: string;
  requestMeta: {
    ip: string;
    userAgent: string;
  };
}

export const signDocumentMapper = (req: Request): SignDocumentInput => {
  const { carrierId, organizationId } = getCarrierContext(req);
  return {
    documentId: req.params.id ?? '',
    carrierId,
    organizationId,
    signatureData: req.body.signatureData,
    consentGiven: req.body.consentGiven,
    signerName: req.body.signerName,
    signerTitle: req.body.signerTitle,
    requestMeta: {
      ip: req.ip ?? '',
      userAgent: req.headers['user-agent'] ?? '',
    },
  };
};
