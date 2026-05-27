import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { Logger } from '@/shared/utils/logger';
import { dashboardQueryPrisma } from './repositories/dashboardQueryPrisma';
import { createDashboardService } from './services/dashboardService';
import { createDashboardControllers } from './controllers/dashboardController';
import type { DashboardControllers } from './controllers/dashboardController';
import { createPendingCarriersControllers } from './controllers/pendingCarriersController';
import type { PendingCarriersControllers } from './controllers/pendingCarriersController';
import { createPendingCarriersService } from './services/pendingCarriersService';
import type { PendingCarriersPort, PendingCarrier } from './types/pendingCarriersTypes';

interface DashboardModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  logger: Logger;
}

export const createDashboardModule = ({
  prismaClient,
}: DashboardModuleDeps): {
  controllers: DashboardControllers & PendingCarriersControllers;
} => {
  const dashboardQuery = dashboardQueryPrisma(prismaClient);

  const dashboardService = createDashboardService({
    dashboardQuery,
  });

  const pendingCarriersPort: PendingCarriersPort = {
    listPending: async (
      organizationId: string,
      page: number,
      limit: number,
    ): Promise<{ data: PendingCarrier[]; total: number }> => {
      const skip = (page - 1) * limit;

      const whereClause = {
        managedByOrgId: organizationId,
        status: 'PENDING_APPROVAL' as const,
        deletedAt: null,
      };

      const [carrierRows, total] = await Promise.all([
        prismaClient.carrier.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prismaClient.carrier.count({ where: whereClause }),
      ]);

      const carrierIds = carrierRows.map((c) => c.id);

      const [sessions, driverCounts, vehicleCounts] = await Promise.all([
        prismaClient.onboardingSession.findMany({
          where: { carrierId: { in: carrierIds } },
          select: { carrierId: true, completedAt: true },
        }),
        prismaClient.driver.groupBy({
          by: ['carrierId'],
          where: { carrierId: { in: carrierIds }, deletedAt: null },
          _count: { id: true },
        }),
        prismaClient.vehicle.groupBy({
          by: ['carrierId'],
          where: { carrierId: { in: carrierIds }, deletedAt: null },
          _count: { id: true },
        }),
      ]);

      const sessionMap = new Map(
        sessions.map((s) => [s.carrierId, s.completedAt]),
      );
      const driverCountMap = new Map(
        driverCounts.map((d) => [d.carrierId, d._count.id]),
      );
      const vehicleCountMap = new Map(
        vehicleCounts.map((v) => [v.carrierId, v._count.id]),
      );

      const data: PendingCarrier[] = carrierRows.map((carrier) => ({
        id: carrier.id,
        name: carrier.name,
        email: carrier.email ?? null,
        phone: carrier.phone ?? null,
        type: carrier.type ?? '',
        status: carrier.status,
        entryMethod: carrier.entryMethod ?? null,
        completedAt: sessionMap.get(carrier.id) ?? null,
        inviteSentAt: carrier.inviteSentAt ?? null,
        driverCount: driverCountMap.get(carrier.id) ?? 0,
        vehicleCount: vehicleCountMap.get(carrier.id) ?? 0,
      }));

      return { data, total };
    },
  };

  const pendingCarriersService = createPendingCarriersService({
    pendingCarriersPort,
  });

  const dashboardControllers = createDashboardControllers({
    dashboardService,
  });

  const pendingCarriersControllers = createPendingCarriersControllers({
    pendingCarriersService,
  });

  const controllers = {
    ...dashboardControllers,
    ...pendingCarriersControllers,
  };

  return { controllers };
};
