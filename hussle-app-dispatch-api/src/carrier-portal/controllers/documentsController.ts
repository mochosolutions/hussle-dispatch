import type { Request, Response } from 'express';
import type { PortalDocument } from '../types/portalDocumentsTypes';
import { sendSingle } from '@/shared/responseEnvelope';
import {
  listDocumentsMapper,
  presignDocumentMapper,
  confirmDocumentMapper,
} from './mappers/documentsMapper';
import {
  portalDocumentListTransformer,
  portalDocumentTransformer,
  presignDocumentTransformer,
} from './transformers/documentsTransformer';

interface PresignResult {
  documentId: string;
  uploadUrl: string;
  fields: Record<string, string>;
}

interface DocumentsService {
  listDocuments(carrierId: string, organizationId: string): Promise<PortalDocument[]>;
  presignDocument(
    carrierId: string,
    organizationId: string,
    input: {
      fileName: string;
      contentType: string;
      documentType: string;
      expiresAt?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<PresignResult>;
  confirmDocument(
    documentId: string,
    carrierId: string,
    organizationId: string,
    input: { expiresAt?: string; metadata?: Record<string, unknown> },
  ): Promise<PortalDocument>;
}

interface DocumentsControllerDeps {
  documentsService: DocumentsService;
}

export const createDocumentsControllers = (deps: DocumentsControllerDeps) => ({
  listDocuments: async (req: Request, res: Response) => {
    const { carrierId, organizationId } = listDocumentsMapper(req);
    const documents = await deps.documentsService.listDocuments(carrierId, organizationId);
    const response = portalDocumentListTransformer(documents);
    sendSingle(res, response);
  },

  presignDocument: async (req: Request, res: Response) => {
    const { carrierId, organizationId, fileName, contentType, documentType, expiresAt, metadata } =
      presignDocumentMapper(req);
    const result = await deps.documentsService.presignDocument(carrierId, organizationId, {
      fileName,
      contentType,
      documentType,
      expiresAt,
      metadata,
    });
    const response = presignDocumentTransformer(result);
    sendSingle(res, response);
  },

  confirmDocument: async (req: Request, res: Response) => {
    const { documentId, carrierId, organizationId, expiresAt, metadata } =
      confirmDocumentMapper(req);
    const updated = await deps.documentsService.confirmDocument(
      documentId,
      carrierId,
      organizationId,
      { expiresAt, metadata },
    );
    const response = portalDocumentTransformer(updated);
    sendSingle(res, response);
  },
});
