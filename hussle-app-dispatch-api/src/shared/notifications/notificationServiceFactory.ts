import type { Logger } from '../utils/logger';
import type { NotificationService } from './notificationService';
import { createConsoleNotificationService } from './consoleNotificationService';

interface NotificationConfig {
  backend?: 'console';
}

/**
 * Factory for creating a NotificationService.
 * Currently only supports 'console' backend (dev/MVP).
 * Add SES/SendGrid backends as needed.
 */
export const createNotificationService = (
  config: NotificationConfig,
  logger: Logger,
): NotificationService => {
  const backend = config.backend ?? 'console';

  if (backend === 'console') {
    return createConsoleNotificationService(logger);
  }

  // Default fallback
  return createConsoleNotificationService(logger);
};
