import type { PrismaClient, DriverStatus } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

interface DriverCreateData {
  carrierId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  status: DriverStatus;
  notes: string | null;
}

interface SavedDriver {
  id: string;
  firstName: string;
  lastName: string;
}

export interface PortalDriverRepoPort {
  deleteByCarrierId(carrierId: string): Promise<void>;
  create(data: DriverCreateData): Promise<SavedDriver>;
}

export const portalDriverRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): PortalDriverRepoPort => ({
  deleteByCarrierId: async (carrierId) => {
    await prisma.driver.deleteMany({ where: { carrierId } });
  },

  create: async (data) => {
    const driver = await prisma.driver.create({ data });
    return {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
    };
  },
});
