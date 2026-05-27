import type { Request } from 'express';
import type { SendManualPromptInput } from '../../services/smsPromptService';

export const sendManualPromptMapper = (req: Request): SendManualPromptInput => ({
  loadId: req.params['loadId'] ?? '',
  organizationId: req.organizationId ?? '',
  requestingUserId: req.user?.userId ?? '',
});
