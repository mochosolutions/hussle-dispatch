import type { Logger } from '../utils/logger';
import type { NotificationService } from './notificationService';

/**
 * Dev/MVP implementation of NotificationService.
 * Logs all notifications via the project logger instead of sending them.
 */
export const createConsoleNotificationService = (
  logger: Logger,
): NotificationService => ({
  sendEmail: async (params) => {
    logger.info('NotificationService: email sent (console)', {
      to: params.to,
      from: params.from,
      subject: params.subject,
      hasAttachments: params.attachments !== undefined && params.attachments.length > 0,
      attachmentCount: params.attachments?.length ?? 0,
    });
  },
});
