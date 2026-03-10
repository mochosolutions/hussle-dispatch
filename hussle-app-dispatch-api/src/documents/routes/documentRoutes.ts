import express from 'express';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { DocumentControllers } from '../controllers/documentController';
import {
  presignValidator,
  confirmValidator,
  listDocumentsValidator,
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

  return router;
};
