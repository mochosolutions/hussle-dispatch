import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { DocumentService } from '../types/documentServiceTypes';

interface BulkDownloadControllerDeps {
  documentService: DocumentService;
}

export const createBulkDownloadController = (
  deps: BulkDownloadControllerDeps,
): RequestHandler =>
  async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId ?? '';
    const { documentIds } = req.body;

    const result = await deps.documentService.bulkDownload({
      organizationId,
      documentIds,
    });

    sendSingle(res, result);
  };
