import express from 'express';
import multer from 'multer';

import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';

import type { RateconImportControllers } from '../controllers/rateconImportController';
import {
  acceptImportValidator,
  importIdValidator,
  listImportsValidator,
} from '../validators/rateconImportValidators';

const MAX_PDF_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_BYTES, files: 1 },
});

const ALLOWED_ROLES = [ROLES.ADMIN, ROLES.DISPATCHER];

export const createRateconImportRoutes = (
  controllers: RateconImportControllers,
): express.Router => {
  const router = express.Router();

  router.get(
    '/',
    requireAuth,
    requireRole(ALLOWED_ROLES),
    validateRequest(listImportsValidator),
    controllers.list,
  );

  router.post('/manual', requireAuth, requireRole(ALLOWED_ROLES), upload.single('file'), controllers.manualUpload);

  router.get(
    '/:id',
    requireAuth,
    requireRole(ALLOWED_ROLES),
    validateRequest(importIdValidator),
    controllers.getById,
  );

  router.post(
    '/:id/accept',
    requireAuth,
    requireRole(ALLOWED_ROLES),
    validateRequest(acceptImportValidator),
    controllers.accept,
  );

  router.post(
    '/:id/reject',
    requireAuth,
    requireRole(ALLOWED_ROLES),
    validateRequest(importIdValidator),
    controllers.reject,
  );

  router.post(
    '/:id/retry',
    requireAuth,
    requireRole(ALLOWED_ROLES),
    validateRequest(importIdValidator),
    controllers.retry,
  );

  return router;
};
