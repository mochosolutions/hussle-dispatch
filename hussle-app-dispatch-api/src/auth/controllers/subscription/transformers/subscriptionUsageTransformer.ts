import type { SubscriptionUsage } from '../../../services/subscription/subscriptionUsageService';

interface UsageEntryResponse {
  current: number;
  limit: number;
}

interface SubscriptionUsageResponse {
  users: UsageEntryResponse;
  vehicles: UsageEntryResponse;
}

export const toSubscriptionUsageResponse = (
  usage: SubscriptionUsage,
): SubscriptionUsageResponse => ({
  users: {
    current: usage.users.current,
    limit: usage.users.limit,
  },
  vehicles: {
    current: usage.vehicles.current,
    limit: usage.vehicles.limit,
  },
});
