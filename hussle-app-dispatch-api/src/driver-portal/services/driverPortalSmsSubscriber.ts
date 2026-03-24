import type { EventBus } from '@/shared/messaging/eventBus';
import type { SmsService } from '@/shared/notifications/smsService';
import type { Logger } from '@/shared/utils/logger';
import type { NotificationLogRepoPort } from '../../notifications/types/notificationRepoPort';
import type { TrackingTokenService } from '../../notifications/services/trackingTokenService';
import type { DriverPortalLoadQueryPort } from '../types/driverPortalTypes';

interface DriverPortalSmsSubscriberDeps {
  eventBus: EventBus;
  smsService: SmsService;
  trackingTokenService: TrackingTokenService;
  logRepo: NotificationLogRepoPort;
  loadQuery: DriverPortalLoadQueryPort;
  logger: Logger;
  trackingBaseUrl: string;
}

export const initializeDriverPortalSmsSubscriber = async (
  deps: DriverPortalSmsSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe(
    'load.status.changed',
    'driver-portal-sms',
    async (data) => {
      try {
        if (data.toStatus !== 'DISPATCHED') {
          return;
        }

        await sendDriverPortalSms({
          loadId: data.loadId,
          loadNumber: data.loadNumber,
          deps,
        });
      } catch (error: unknown) {
        deps.logger.error('Failed to send driver portal SMS on dispatch', {
          loadId: data.loadId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  deps.logger.info('Driver portal SMS subscriber initialized');
};

interface SendDriverPortalSmsInput {
  loadId: string;
  loadNumber: string;
  deps: DriverPortalSmsSubscriberDeps;
}

export const sendDriverPortalSms = async (
  input: SendDriverPortalSmsInput,
): Promise<void> => {
  const { loadId, loadNumber, deps } = input;

  const driverInfo = await deps.loadQuery.findDriverPhoneByLoadId(loadId);

  if (driverInfo === null) {
    deps.logger.warn('No driver assigned or driver has no phone for driver portal SMS', { loadId });
    return;
  }

  const tokenRecord = await deps.trackingTokenService.getOrCreateDriverToken(loadId);
  const portalUrl = `${deps.trackingBaseUrl}/driver-portal/${tokenRecord.token}`;

  const smsBody = `Load ${loadNumber} has been dispatched to you. View details and update status: ${portalUrl}`;

  await deps.smsService.sendSms({
    to: driverInfo.phone,
    body: smsBody,
  });

  await deps.logRepo.create({
    loadId,
    trigger: 'STATUS_CHANGE',
    channel: 'SMS',
    recipientPhone: driverInfo.phone,
    status: 'sent',
    metadata: { type: 'driver_portal_link', driverName: driverInfo.driverName },
  });

  deps.logger.info('Driver portal SMS sent', { loadId, driverPhone: driverInfo.phone });
};
