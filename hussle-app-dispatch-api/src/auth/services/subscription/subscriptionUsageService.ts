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
    const [memberCount, pendingInviteCount, vehicleCount] = await Promise.all([
      deps.prismaClient.membership.count({
        where: {
          organizationId,
          deleted: false,
          status: 'active',
        },
      }),
      deps.prismaClient.invitation.count({
        where: {
          organizationId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
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
        // Mirror the invite seat-gate: active members + outstanding (non-expired) invites.
        current: memberCount + pendingInviteCount,
        limit: SUBSCRIPTION_LIMITS.maxUsers,
      },
      vehicles: {
        current: vehicleCount,
        limit: SUBSCRIPTION_LIMITS.maxVehicles,
      },
    };
  },
});
