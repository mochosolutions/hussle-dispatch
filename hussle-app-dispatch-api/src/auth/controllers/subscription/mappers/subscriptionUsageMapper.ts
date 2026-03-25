import type { Request } from 'express';

interface SubscriptionUsageInput {
  organizationId: string;
}

export const subscriptionUsageMapper = (req: Request): SubscriptionUsageInput => ({
  organizationId: req.user?.organizationId ?? '',
});
