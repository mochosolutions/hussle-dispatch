import express from 'express';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { DocumentControllers } from '../controllers/documentController';
import {
  presignValidator,
  confirmValidator,
  documentIdValidator,
  listDocumentsValidator,
  bulkDownloadValidator,
} from '../validators/documentValidators';

export const createDocumentRoutes = (controllers: DocumentControllers): express.Router => {
  const router = express.Router();

  router.post(
    '/presign',
    requireAuth,
    validateRequest(presignValidator),
    controllers.presign,
  );

  router.post(
    '/:id/confirm',
    requireAuth,
    validateRequest(confirmValidator),
    controllers.confirm,
  );

  router.get(
    '/',
    requireAuth,
    validateRequest(listDocumentsValidator),
    controllers.list,
  );

  router.get(
    '/:id',
    requireAuth,
    validateRequest(documentIdValidator),
    controllers.getById,
  );

  router.get(
    '/:id/download',
    requireAuth,
    validateRequest(documentIdValidator),
    controllers.download,
  );

  router.patch(
    '/:id/archive',
    requireAuth,
    validateRequest(documentIdValidator),
    controllers.archive,
  );

  router.post(
    '/bulk-download',
    requireAuth,
    validateRequest(bulkDownloadValidator),
    controllers.bulkDownload,
  );

  return router;
};
