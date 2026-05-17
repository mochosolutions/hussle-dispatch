import type { PrismaClient, DriverStatus, DriverPayType, Prisma } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

interface UpsertDriverData {
  id?: string;
  carrierId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  status: DriverStatus;
  notes: string | null;
  payType: DriverPayType;
  payRate: number;
}

interface SavedDriver {
  id: string;
  firstName: string;
  lastName: string;
}

export interface PortalDriverRepoPort {
  findByCarrierId(carrierId: string): Promise<{ id: string }[]>;
  upsertMany(
    carrierId: string,
    data: UpsertDriverData[],
    deleteIds: string[],
  ): Promise<SavedDriver[]>;
  deleteByCarrierId(carrierId: string): Promise<void>;
}

export const portalDriverRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): PortalDriverRepoPort => ({
  findByCarrierId: async (carrierId) =>
    prisma.driver.findMany({
      where: { carrierId, deletedAt: null },
      select: { id: true },
    }),

  upsertMany: async (carrierId, data, deleteIds) => {
    type Tx = PrismaTransaction | Prisma.TransactionClient;
    const run = async (tx: Tx): Promise<SavedDriver[]> => {
      if (deleteIds.length > 0) {
        // Soft-delete missing rows so historical references survive.
        await tx.driver.updateMany({
          where: { id: { in: deleteIds }, carrierId },
          data: { deletedAt: new Date() },
        });
      }

      const results: SavedDriver[] = [];
      for (const d of data) {
        const writeData = {
          carrierId: d.carrierId,
          firstName: d.firstName,
          lastName: d.lastName,
          phone: d.phone,
          email: d.email,
          status: d.status,
          notes: d.notes,
          payType: d.payType,
          payRate: d.payRate,
        };
        const driver = d.id
          ? await tx.driver.update({ where: { id: d.id }, data: writeData })
          : await tx.driver.create({ data: writeData });
        results.push({ id: driver.id, firstName: driver.firstName, lastName: driver.lastName });
      }
      return results;
    };

    if ('$transaction' in prisma) {
      return prisma.$transaction((tx) => run(tx));
    }
    return run(prisma);
  },

  deleteByCarrierId: async (carrierId) => {
    await prisma.driver.updateMany({
      where: { carrierId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },
});
