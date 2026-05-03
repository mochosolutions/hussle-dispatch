import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  OrganizationHeadquartersLocation,
  OrganizationQueryPort,
} from '../types/organizationQueryPort';

export const organizationQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): OrganizationQueryPort => ({
  findHeadquartersLocation: async (
    organizationId: string,
  ): Promise<OrganizationHeadquartersLocation | null> => {
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
      latitude: org.headquartersLatitude !== null ? org.headquartersLatitude.toNumber() : null,
      longitude: org.headquartersLongitude !== null ? org.headquartersLongitude.toNumber() : null,
    };
  },
});
