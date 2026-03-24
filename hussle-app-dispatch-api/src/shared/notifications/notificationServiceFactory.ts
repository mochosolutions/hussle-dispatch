import type { Logger } from '../utils/logger';
import type { NotificationService } from './notificationService';
import type { SmsService } from './smsService';
import { createConsoleNotificationService } from './consoleNotificationService';
import { createConsoleSmsService } from './consoleSmsService';
import { createSesNotificationService } from './sesNotificationService';
import { createSmtpNotificationService } from './smtpNotificationService';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

interface NotificationConfig {
  backend?: 'console' | 'ses' | 'smtp';
  region?: string;
  smtp?: SmtpConfig;
}

/**
 * Factory for creating a NotificationService (email).
 * Supports 'console' (dev logging), 'ses' (AWS SES production),
 * and 'smtp' (local SMTP server like Mailpit).
 */
export const createNotificationService = (
  config: NotificationConfig,
  logger: Logger,
): NotificationService => {
  const backend = config.backend ?? 'console';

  if (backend === 'ses') {
    const region = config.region ?? 'us-east-1';
    logger.info('NotificationService: using SES backend', { region });
    return createSesNotificationService({ region }, logger);
  }

  if (backend === 'smtp') {
    const smtp = config.smtp ?? { host: 'localhost', port: 1025, secure: false, user: '', pass: '' };
    logger.info('NotificationService: using SMTP backend', { host: smtp.host, port: smtp.port });
    return createSmtpNotificationService(smtp, logger);
  }

  return createConsoleNotificationService(logger);
};

/**
 * Factory for creating an SmsService.
 * Currently only supports 'console' backend (dev/MVP).
 * Add SNS/Twilio backends as needed.
 */
export const createSmsService = (
  config: NotificationConfig,
  logger: Logger,
): SmsService => {
  const backend = config.backend ?? 'console';

  if (backend === 'console') {
    return createConsoleSmsService(logger);
  }

  return createConsoleSmsService(logger);
};
