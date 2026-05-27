import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import { ValidationError } from '@/shared/errors';
import type { NotificationSettingsService } from '../services/notificationSettingsService';
import type { NotificationTrigger, NotificationChannel } from '../types/notificationTypes';

const requireParam = (params: Record<string, string | undefined>, key: string): string => {
  const value = params[key];
  if (value === undefined || value.length === 0) {
    throw new ValidationError(`Missing required parameter: ${key}`);
  }
  return value;
};

export interface NotificationSettingsControllers {
  getByCustomerId: RequestHandler;
  upsert: RequestHandler;
  bulkUpsert: RequestHandler;
}

interface NotificationSettingsControllerDeps {
  settingsService: NotificationSettingsService;
}

const toSettingsResponse = (record: {
  id: string;
  customerId: string;
  trigger: string;
  channel: string;
  enabled: boolean;
  recipientEmail: string | null;
  recipientPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: record.id,
  customerId: record.customerId,
  trigger: record.trigger,
  channel: record.channel,
  enabled: record.enabled,
  recipientEmail: record.recipientEmail,
  recipientPhone: record.recipientPhone,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export const createNotificationSettingsControllers = (
  deps: NotificationSettingsControllerDeps,
): NotificationSettingsControllers => ({
  getByCustomerId: async (req: Request, res: Response): Promise<void> => {
    const customerId = requireParam(req.params, 'customerId');
    const settings = await deps.settingsService.getByCustomerId(customerId);
    sendSingle(res, settings.map(toSettingsResponse));
  },

  upsert: async (req: Request, res: Response): Promise<void> => {
    const customerId = requireParam(req.params, 'customerId');
    const { trigger, channel, enabled, recipientEmail, recipientPhone } = req.body;

    const result = await deps.settingsService.upsert({
      customerId,
      trigger: trigger as NotificationTrigger,
      channel: channel as NotificationChannel,
      enabled,
      recipientEmail,
      recipientPhone,
    });

    sendSingle(res, toSettingsResponse(result));
  },

  bulkUpsert: async (req: Request, res: Response): Promise<void> => {
    const customerId = requireParam(req.params, 'customerId');
    const { settings } = req.body;

    const inputs = (settings as Array<{
      trigger: string;
      channel: string;
      enabled: boolean;
      recipientEmail?: string;
      recipientPhone?: string;
    }>).map((s) => ({
      customerId,
      trigger: s.trigger as NotificationTrigger,
      channel: s.channel as NotificationChannel,
      enabled: s.enabled,
      recipientEmail: s.recipientEmail,
      recipientPhone: s.recipientPhone,
    }));

    const results = await deps.settingsService.bulkUpsert(inputs);
    sendSingle(res, results.map(toSettingsResponse));
  },
});
