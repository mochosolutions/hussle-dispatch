import type { Request, RequestHandler, Response } from 'express';
import type { SubscriptionUsage } from '../../services/subscription/subscriptionUsageService';
import { sendSingle } from '@/shared/responseEnvelope';
import { subscriptionUsageMapper } from './mappers/subscriptionUsageMapper';
import { toSubscriptionUsageResponse } from './transformers/subscriptionUsageTransformer';

interface SubscriptionUsageControllerDeps {
  getUsage: (input: { organizationId: string }) => Promise<SubscriptionUsage>;
}

export const createSubscriptionUsageController =
  (deps: SubscriptionUsageControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const input = subscriptionUsageMapper(req);
    const usage = await deps.getUsage(input);
    const response = toSubscriptionUsageResponse(usage);
    sendSingle(res, response);
  };
