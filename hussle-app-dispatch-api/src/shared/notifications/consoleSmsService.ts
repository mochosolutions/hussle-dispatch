import type { Logger } from '../utils/logger';
import type { SmsService } from './smsService';

/**
 * Dev/MVP implementation of SmsService.
 * Logs all SMS messages via the project logger instead of sending them.
 */
export const createConsoleSmsService = (
  logger: Logger,
): SmsService => ({
  sendSms: async (params) => {
    logger.info('SmsService: SMS sent (console)', {
      to: params.to,
      bodyLength: params.body.length,
      bodyPreview: params.body.slice(0, 100),
    });
  },
});
