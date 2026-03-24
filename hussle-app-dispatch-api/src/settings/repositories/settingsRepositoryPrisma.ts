import type { PrismaClient } from '@prisma/client';
import type { SettingsRepoPort, UpdateSettingsInput } from '../types/settingsTypes';

export const settingsRepositoryPrisma = (prisma: PrismaClient): SettingsRepoPort => ({
  findByOrganizationId: async (organizationId) => {
    return prisma.orgSettings.findUnique({
      where: { organizationId },
    });
  },

  upsert: async (organizationId, data) => {
    const { organizationId: _organizationId, ...fields } = data;

    return prisma.orgSettings.upsert({
      where: { organizationId },
      create: { organizationId, ...fields },
      update: { ...fields },
    });
  },
});
