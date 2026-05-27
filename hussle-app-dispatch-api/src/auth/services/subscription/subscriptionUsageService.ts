import type { PrismaClient } from '@prisma/client';
import { SUBSCRIPTION_LIMITS } from '@/config/subscriptionLimits';

interface UsageEntry {
  current: number;
  limit: number;
}

export interface SubscriptionUsage {
  users: UsageEntry;
  vehicles: UsageEntry;
}

interface GetUsageInput {
  organizationId: string;
}

interface SubscriptionUsageServiceDeps {
  prismaClient: PrismaClient;
}

export const createSubscriptionUsageService = (deps: SubscriptionUsageServiceDeps) => ({
  getUsage: async ({ organizationId }: GetUsageInput): Promise<SubscriptionUsage> => {
    const [userCount, vehicleCount] = await Promise.all([
      deps.prismaClient.membership.count({
        where: {
          organizationId,
          deleted: false,
          status: 'active',
        },
      }),
      deps.prismaClient.vehicle.count({
        where: {
          carrier: { managedByOrgId: organizationId },
          isActive: true,
          deletedAt: null,
        },
      }),
    ]);

    return {
      users: {
        current: userCount,
        limit: SUBSCRIPTION_LIMITS.maxUsers,
      },
      vehicles: {
        current: vehicleCount,
        limit: SUBSCRIPTION_LIMITS.maxVehicles,
      },
    };
  },
});
