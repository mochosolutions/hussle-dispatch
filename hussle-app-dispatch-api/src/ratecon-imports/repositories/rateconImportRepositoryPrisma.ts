import type { PrismaClient } from '@prisma/client';

import type {
  CreateRateconImportData,
  ListImportsInput,
  RateconImportRepoPort,
  UpdateRateconImportData,
} from '../types/rateconImportTypes';

type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

const RESOLVED_STATUSES = ['ACCEPTED', 'REJECTED'] as const;

export const rateconImportRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): RateconImportRepoPort => ({
  create: (data: CreateRateconImportData) => prisma.pendingRateconImport.create({ data }),

  findById: (importId: string, organizationId: string) =>
    prisma.pendingRateconImport.findFirst({
      where: { id: importId, organizationId, deletedAt: null },
    }),

  findMany: (filters: ListImportsInput) => {
    const where: Record<string, unknown> = {
      organizationId: filters.organizationId,
      deletedAt: null,
    };

    if (filters.status !== undefined) {
      where.status = filters.status;
    } else if (filters.includeResolved !== true) {
      where.status = { notIn: RESOLVED_STATUSES };
    }

    return prisma.pendingRateconImport.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
    });
  },

  update: (importId: string, organizationId: string, data: UpdateRateconImportData) =>
    prisma.pendingRateconImport.update({
      where: { id: importId, organizationId },
      data,
    }),

  existsByMessageId: async (organizationId: string, emailMessageId: string) => {
    const count = await prisma.pendingRateconImport.count({
      where: { organizationId, emailMessageId },
    });
    return count > 0;
  },
});
