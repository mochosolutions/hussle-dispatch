import express from 'express';
import { ROLES } from '@/config/roles';
import { requireAuth, requireRole } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { SmsPromptControllers } from '../controllers/smsPromptController';
import {
  listPromptsForLoadValidator,
  sendManualPromptValidator,
} from '../validators/smsPromptValidators';

export const createSmsPromptRoutes = (
  controllers: SmsPromptControllers,
): express.Router => {
  const router = express.Router();

  router.post(
    '/:loadId/sms-prompts',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(sendManualPromptValidator),
    controllers.sendManual,
  );

  router.get(
    '/:loadId/sms-prompts',
    requireAuth,
    validateRequest(listPromptsForLoadValidator),
    controllers.listForLoad,
  );

  return router;
};
