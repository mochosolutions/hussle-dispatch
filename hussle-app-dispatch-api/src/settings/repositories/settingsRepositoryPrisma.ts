import type { PrismaClient } from '@prisma/client';
import type { SettingsRepoPort } from '../types/settingsTypes';

export const settingsRepositoryPrisma = (prisma: PrismaClient): SettingsRepoPort => ({
  findByOrganizationId: async (organizationId) => {
    return prisma.orgSettings.findUnique({
      where: { organizationId },
    });
  },

  upsert: async (organizationId, data) => {
    const {
      organizationId: _organizationId,
      headquartersLatitude: _headquartersLatitude,
      headquartersLongitude: _headquartersLongitude,
      ...fields
    } = data;

    return prisma.orgSettings.upsert({
      where: { organizationId },
      create: { organizationId, ...fields },
      update: { ...fields },
    });
  },

  getOrganizationHq: async (organizationId) => {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        headquartersLatitude: true,
        headquartersLongitude: true,
      },
    });

    if (org === null) {
      return null;
    }

    return {
      headquartersLatitude: org.headquartersLatitude,
      headquartersLongitude: org.headquartersLongitude,
    };
  },

  updateOrganizationHq: async (organizationId, input) => {
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        headquartersLatitude: input.headquartersLatitude,
        headquartersLongitude: input.headquartersLongitude,
      },
    });
  },
});
