import type { Request } from 'express';
import type { SendManualPromptInput } from '../../services/smsPromptService';

export const sendManualPromptMapper = (req: Request): SendManualPromptInput => {
  const rawBody = req.body?.body;
  const customBody =
    typeof rawBody === 'string' && rawBody.trim().length > 0 ? rawBody.trim() : undefined;

  return {
    loadId: req.params['loadId'] ?? '',
    organizationId: req.organizationId ?? '',
    requestingUserId: req.user?.userId ?? '',
    customBody,
  };
};
