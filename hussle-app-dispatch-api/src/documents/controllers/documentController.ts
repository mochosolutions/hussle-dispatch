import type { Request, Response, RequestHandler } from 'express';
import { sendSingle, sendList } from '@/shared/responseEnvelope';
import type { DocumentService } from '../types/documentServiceTypes';
import { presignMapper } from './mappers/presignMapper';
import { confirmMapper } from './mappers/confirmMapper';
import { listDocumentsMapper } from './mappers/listDocumentsMapper';
import { documentIdMapper } from './mappers/documentIdMapper';
import { toDocumentResponse, toDocumentListResponse } from './transformers/documentTransformer';

interface DocumentControllerDeps {
  documentService: DocumentService;
}

export interface DocumentControllers {
  presign: RequestHandler;
  confirm: RequestHandler;
  list: RequestHandler;
  getById: RequestHandler;
  download: RequestHandler;
  archive: RequestHandler;
  bulkDownload: RequestHandler;
}

type BaseDocumentControllers = Omit<DocumentControllers, 'bulkDownload'>;

export const createDocumentControllers = (deps: DocumentControllerDeps): BaseDocumentControllers => ({
  presign: async (req: Request, res: Response): Promise<void> => {
    const input = presignMapper(req);
    const result = await deps.documentService.presign(input);
    sendSingle(res, result, 201);
  },

  confirm: async (req: Request, res: Response): Promise<void> => {
    const input = confirmMapper(req);
    const document = await deps.documentService.confirm(input);
    sendSingle(res, toDocumentResponse(document));
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const input = listDocumentsMapper(req);
    const documents = await deps.documentService.list(input);
    sendList(res, { data: toDocumentListResponse(documents), meta: { page: 1, limit: documents.length, total: documents.length, totalPages: 1, hasMore: false } });
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const input = documentIdMapper(req);
    const document = await deps.documentService.getById(input);
    sendSingle(res, toDocumentResponse(document));
  },

  download: async (req: Request, res: Response): Promise<void> => {
    const input = documentIdMapper(req);
    const url = await deps.documentService.getDownloadUrl(input);
    res.setHeader('Cache-Control', 'no-store');
    res.redirect(302, url);
  },

  archive: async (req: Request, res: Response): Promise<void> => {
    const input = documentIdMapper(req);
    const document = await deps.documentService.archive(input);
    sendSingle(res, toDocumentResponse(document));
  },
});
