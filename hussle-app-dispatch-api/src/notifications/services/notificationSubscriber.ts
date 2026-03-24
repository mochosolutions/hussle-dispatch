import type { EventBus } from '@/shared/messaging/eventBus';
import type { NotificationService } from '@/shared/notifications/notificationService';
import type { SmsService } from '@/shared/notifications/smsService';
import type { Logger } from '@/shared/utils/logger';
import type { NotificationSettingsRepoPort, LoadNotificationOverrideRepoPort, NotificationLogRepoPort } from '../types/notificationRepoPort';
import type { TrackingTokenRepoPort } from '../types/trackingTokenTypes';
import type { ResolvedNotificationConfig } from '../types/notificationTypes';
import { resolveNotificationSettings } from './resolveNotificationSettings';
import { buildStatusChangeContent, buildCheckCallContent } from './notificationContentBuilder';

interface NotificationSubscriberDeps {
  eventBus: EventBus;
  settingsRepo: NotificationSettingsRepoPort;
  overrideRepo: LoadNotificationOverrideRepoPort;
  logRepo: NotificationLogRepoPort;
  tokenRepo: TrackingTokenRepoPort;
  emailService: NotificationService;
  smsService: SmsService;
  logger: Logger;
  trackingBaseUrl: string;
}

/**
 * Contact info from the load — used as the primary recipient.
 * Falls back to what's configured in CustomerNotificationSettings.
 */
interface LoadContactInfo {
  contactEmail: string | null;
  contactPhone: string | null;
}

const buildTrackingUrl = (baseUrl: string, token: string): string =>
  `${baseUrl}/tracking/${token}`;

const getOrCreateTrackingUrl = async (
  loadId: string,
  deps: Pick<NotificationSubscriberDeps, 'tokenRepo' | 'trackingBaseUrl'>,
): Promise<string | null> => {
  const existing = await deps.tokenRepo.findActiveByLoadId(loadId, 'CUSTOMER');

  if (existing !== null) {
    return buildTrackingUrl(deps.trackingBaseUrl, existing.token);
  }

  return null;
};

/**
 * Resolve the actual recipient for a notification config.
 * Priority: load contact > settings-configured recipient.
 */
const resolveRecipientEmail = (
  config: ResolvedNotificationConfig,
  contact: LoadContactInfo,
): string | null =>
  contact.contactEmail ?? config.recipientEmail;

const resolveRecipientPhone = (
  config: ResolvedNotificationConfig,
  contact: LoadContactInfo,
): string | null =>
  contact.contactPhone ?? config.recipientPhone;

const sendNotification = async (
  config: ResolvedNotificationConfig,
  content: { subject: string; html: string; smsBody: string },
  loadId: string,
  fromEmail: string,
  contact: LoadContactInfo,
  deps: Pick<NotificationSubscriberDeps, 'emailService' | 'smsService' | 'logRepo' | 'logger'>,
): Promise<void> => {
  if (config.channel === 'EMAIL') {
    const recipientEmail = resolveRecipientEmail(config, contact);

    if (recipientEmail !== null) {
      await deps.emailService.sendEmail({
        to: recipientEmail,
        from: fromEmail,
        subject: content.subject,
        html: content.html,
      });

      await deps.logRepo.create({
        loadId,
        trigger: config.trigger,
        channel: 'EMAIL',
        recipientEmail,
        subject: content.subject,
        status: 'sent',
      });
    }
  }

  if (config.channel === 'SMS') {
    const recipientPhone = resolveRecipientPhone(config, contact);

    if (recipientPhone !== null) {
      await deps.smsService.sendSms({
        to: recipientPhone,
        body: content.smsBody,
      });

      await deps.logRepo.create({
        loadId,
        trigger: config.trigger,
        channel: 'SMS',
        recipientPhone,
        status: 'sent',
      });
    }
  }
};

const DEFAULT_FROM_EMAIL = 'notifications@hussle.app';

export const initializeNotificationSubscriber = async (
  deps: NotificationSubscriberDeps,
): Promise<void> => {
  // Subscribe to load status changes
  await deps.eventBus.subscribe(
    'load.status.changed',
    'notifications-service',
    async (data) => {
      try {
        if (data.customerId === null) {
          return;
        }

        const [settings, overrides] = await Promise.all([
          deps.settingsRepo.findByCustomerId(data.customerId),
          deps.overrideRepo.findByLoadId(data.loadId),
        ]);

        const configs = resolveNotificationSettings(settings, overrides, 'STATUS_CHANGE');

        if (configs.length === 0) {
          return;
        }

        const trackingUrl = await getOrCreateTrackingUrl(data.loadId, deps);

        const content = buildStatusChangeContent({
          loadNumber: data.loadNumber,
          fromStatus: data.fromStatus,
          toStatus: data.toStatus,
          trackingUrl,
        });

        const contact: LoadContactInfo = {
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
        };

        for (const config of configs) {
          await sendNotification(config, content, data.loadId, DEFAULT_FROM_EMAIL, contact, deps);
        }

        deps.logger.info('Status change notifications sent', {
          loadId: data.loadId,
          configCount: configs.length,
        });
      } catch (error: unknown) {
        deps.logger.error('Failed to process status change notification', {
          loadId: data.loadId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Subscribe to check call events
  await deps.eventBus.subscribe(
    'load.checkcall.logged',
    'notifications-service',
    async (data) => {
      try {
        if (data.customerId === null) {
          return;
        }

        const [settings, overrides] = await Promise.all([
          deps.settingsRepo.findByCustomerId(data.customerId),
          deps.overrideRepo.findByLoadId(data.loadId),
        ]);

        const configs = resolveNotificationSettings(settings, overrides, 'CHECK_CALL');

        if (configs.length === 0) {
          return;
        }

        const trackingUrl = await getOrCreateTrackingUrl(data.loadId, deps);

        const content = buildCheckCallContent({
          loadNumber: data.loadNumber,
          location: data.location,
          status: data.status,
          eta: data.eta,
          trackingUrl,
        });

        const contact: LoadContactInfo = {
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
        };

        for (const config of configs) {
          await sendNotification(config, content, data.loadId, DEFAULT_FROM_EMAIL, contact, deps);
        }

        deps.logger.info('Check call notifications sent', {
          loadId: data.loadId,
          configCount: configs.length,
        });
      } catch (error: unknown) {
        deps.logger.error('Failed to process check call notification', {
          loadId: data.loadId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  deps.logger.info('Notification subscriber initialized');
};
