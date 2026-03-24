import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError } from '@/shared/errors';
import type { DocumentService } from '../types/documentServiceTypes';

interface BulkDownloadControllerDeps {
  documentService: DocumentService;
}

export const createBulkDownloadController = (
  deps: BulkDownloadControllerDeps,
): RequestHandler =>
  async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId;
    if (organizationId === undefined) {
      throw new UnauthorizedError('Authentication required');
    }

    const { documentIds } = req.body;

    const result = await deps.documentService.bulkDownload({
      organizationId,
      documentIds,
    });

    sendSingle(res, result);
  };
