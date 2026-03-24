import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import { ValidationError } from '@/shared/errors';
import type { LoadNotificationOverrideService } from '../services/loadNotificationOverrideService';
import type { NotificationLogRepoPort } from '../types/notificationRepoPort';
import type { NotificationTrigger, NotificationChannel } from '../types/notificationTypes';

const requireParam = (params: Record<string, string | undefined>, key: string): string => {
  const value = params[key];
  if (value === undefined || value.length === 0) {
    throw new ValidationError(`Missing required parameter: ${key}`);
  }
  return value;
};

export interface LoadNotificationControllers {
  getOverrides: RequestHandler;
  upsertOverride: RequestHandler;
  bulkUpsertOverrides: RequestHandler;
  getHistory: RequestHandler;
}

interface LoadNotificationControllerDeps {
  overrideService: LoadNotificationOverrideService;
  logRepo: NotificationLogRepoPort;
}

const toOverrideResponse = (record: {
  id: string;
  loadId: string;
  trigger: string;
  channel: string;
  enabled: boolean;
  recipientEmail: string | null;
  recipientPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: record.id,
  loadId: record.loadId,
  trigger: record.trigger,
  channel: record.channel,
  enabled: record.enabled,
  recipientEmail: record.recipientEmail,
  recipientPhone: record.recipientPhone,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

const toLogResponse = (record: {
  id: string;
  loadId: string;
  trigger: string;
  channel: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  subject: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
}) => ({
  id: record.id,
  loadId: record.loadId,
  trigger: record.trigger,
  channel: record.channel,
  recipientEmail: record.recipientEmail,
  recipientPhone: record.recipientPhone,
  subject: record.subject,
  status: record.status,
  errorMessage: record.errorMessage,
  createdAt: record.createdAt.toISOString(),
});

export const createLoadNotificationControllers = (
  deps: LoadNotificationControllerDeps,
): LoadNotificationControllers => ({
  getOverrides: async (req: Request, res: Response): Promise<void> => {
    const loadId = requireParam(req.params, 'loadId');
    const overrides = await deps.overrideService.getByLoadId(loadId);
    sendSingle(res, overrides.map(toOverrideResponse));
  },

  upsertOverride: async (req: Request, res: Response): Promise<void> => {
    const loadId = requireParam(req.params, 'loadId');
    const { trigger, channel, enabled, recipientEmail, recipientPhone } = req.body;

    const result = await deps.overrideService.upsert({
      loadId,
      trigger: trigger as NotificationTrigger,
      channel: channel as NotificationChannel,
      enabled,
      recipientEmail,
      recipientPhone,
    });

    sendSingle(res, toOverrideResponse(result));
  },

  bulkUpsertOverrides: async (req: Request, res: Response): Promise<void> => {
    const loadId = requireParam(req.params, 'loadId');
    const { overrides } = req.body;

    const inputs = (overrides as Array<{
      trigger: string;
      channel: string;
      enabled: boolean;
      recipientEmail?: string;
      recipientPhone?: string;
    }>).map((o) => ({
      loadId,
      trigger: o.trigger as NotificationTrigger,
      channel: o.channel as NotificationChannel,
      enabled: o.enabled,
      recipientEmail: o.recipientEmail,
      recipientPhone: o.recipientPhone,
    }));

    const results = await deps.overrideService.bulkUpsert(inputs);
    sendSingle(res, results.map(toOverrideResponse));
  },

  getHistory: async (req: Request, res: Response): Promise<void> => {
    const loadId = requireParam(req.params, 'loadId');
    const logs = await deps.logRepo.findByLoadId(loadId);
    sendSingle(res, logs.map(toLogResponse));
  },
});
