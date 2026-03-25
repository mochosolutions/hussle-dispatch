import type { Logger } from '../utils/logger';
import type { NotificationService } from './notificationService';
import type { SmsService } from './smsService';
import { createConsoleNotificationService } from './consoleNotificationService';
import { createConsoleSmsService } from './consoleSmsService';
import { createSesNotificationService } from './sesNotificationService';
import { createSmtpNotificationService } from './smtpNotificationService';
import { createTwilioSmsService } from './twilioSmsService';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

interface NotificationConfig {
  backend?: 'console' | 'ses' | 'smtp';
  region?: string;
  smtp?: SmtpConfig;
}

interface SmsConfig {
  backend?: 'console' | 'twilio';
  twilio?: TwilioConfig;
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
 * Supports 'console' (dev logging) and 'twilio' (production SMS).
 */
export const createSmsService = (
  config: SmsConfig,
  logger: Logger,
): SmsService => {
  const backend = config.backend ?? 'console';

  if (backend === 'twilio') {
    if (!config.twilio) {
      logger.warn('SmsService: twilio backend selected but no config provided, falling back to console');
      return createConsoleSmsService(logger);
    }
    logger.info('SmsService: using Twilio backend', { from: config.twilio.fromNumber });
    return createTwilioSmsService(config.twilio, logger);
  }

  return createConsoleSmsService(logger);
};
