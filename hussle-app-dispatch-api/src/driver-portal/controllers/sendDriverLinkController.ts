import type { Request, Response } from 'express';
import type { Logger } from '@/shared/utils/logger';
import type { TrackingTokenService } from '../../notifications/services/trackingTokenService';
import type { SmsService } from '@/shared/notifications/smsService';
import type { NotificationLogRepoPort } from '../../notifications/types/notificationRepoPort';
import type { DriverPortalLoadQueryPort } from '../types/driverPortalTypes';
import { ValidationError } from '@/shared/errors';
import { sendSingle } from '@/shared/responseEnvelope';

interface SendDriverLinkControllerDeps {
  loadQuery: DriverPortalLoadQueryPort;
  trackingTokenService: TrackingTokenService;
  smsService: SmsService;
  logRepo: NotificationLogRepoPort;
  logger: Logger;
  trackingBaseUrl: string;
}

const DISPATCHED_OR_LATER = [
  'DISPATCHED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
  'INVOICE_PENDING',
  'INVOICED',
  'PAID',
];

export const createSendDriverLinkController = (deps: SendDriverLinkControllerDeps) =>
  async (req: Request<{ loadId: string }>, res: Response): Promise<void> => {
    const { loadId } = req.params;

    const loadSummary = await deps.loadQuery.findLoadForDriverPortal(loadId);

    if (loadSummary === null) {
      throw new ValidationError('Load not found');
    }

    if (!DISPATCHED_OR_LATER.includes(loadSummary.status)) {
      throw new ValidationError('Load must be dispatched before sending driver link');
    }

    const driverInfo = await deps.loadQuery.findDriverPhoneByLoadId(loadId);

    if (driverInfo === null) {
      throw new ValidationError('No driver assigned or driver has no phone number');
    }

    const tokenRecord = await deps.trackingTokenService.getOrCreateDriverToken(loadId);
    const portalUrl = `${deps.trackingBaseUrl}/driver-portal/${tokenRecord.token}`;

    const smsBody = `Load ${loadSummary.loadNumber} has been dispatched to you. View details and update status: ${portalUrl}`;

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

    deps.logger.info('Driver portal link sent manually', { loadId });

    sendSingle(res, { sent: true });
  };
