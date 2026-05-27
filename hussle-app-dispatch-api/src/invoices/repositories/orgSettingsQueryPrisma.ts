import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { OrgSettingsQueryPort } from '../types/readinessTypes';

export const orgSettingsQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): OrgSettingsQueryPort => ({
  findByOrganizationId: async (organizationId) =>
    prisma.orgSettings.findUnique({
      where: { organizationId },
      select: {
        invoiceWorkflow: true,
        sesFromEmail: true,
        companyLogoUrl: true,
      },
    }),
});
