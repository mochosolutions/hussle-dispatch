import type { PrismaClient, EquipmentType, VehicleCategory, Prisma } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

interface UpsertVehicleData {
  id?: string;
  carrierId: string;
  unitNumber: string;
  type: EquipmentType;
  category: VehicleCategory;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  gvwr?: number;
  lenderName?: string;
  loanPayment?: number;
  loanInterestRate?: number;
  insuranceMonthlyCost?: number;
  deliveryTypes?: string[];
}

interface VehicleSummary {
  id: string;
  category: VehicleCategory | null;
  make: string | null;
  model: string | null;
  year: number | null;
}

export interface PortalVehicleRepoPort {
  findByCarrierId(carrierId: string): Promise<{ id: string; unitNumber: string }[]>;
  upsertMany(
    carrierId: string,
    data: UpsertVehicleData[],
    deleteIds: string[],
  ): Promise<VehicleSummary[]>;
}

export const portalVehicleRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): PortalVehicleRepoPort => ({
  findByCarrierId: async (carrierId) =>
    prisma.vehicle.findMany({
      where: { carrierId },
      select: { id: true, unitNumber: true },
    }),

  upsertMany: async (carrierId, data, deleteIds) => {
    type Tx = PrismaTransaction | Prisma.TransactionClient;
    const run = async (tx: Tx): Promise<VehicleSummary[]> => {
      if (deleteIds.length > 0) {
        await tx.vehicle.deleteMany({
          where: { id: { in: deleteIds }, carrierId },
        });
      }

      const results: VehicleSummary[] = [];
      for (const v of data) {
        const writeData = {
          carrierId: v.carrierId,
          unitNumber: v.unitNumber,
          type: v.type,
          category: v.category,
          year: v.year,
          make: v.make,
          model: v.model,
          vin: v.vin,
          licensePlate: v.licensePlate,
          gvwr: v.gvwr,
          lenderName: v.lenderName,
          loanPayment: v.loanPayment,
          loanInterestRate: v.loanInterestRate,
          insuranceMonthlyCost: v.insuranceMonthlyCost,
          deliveryTypes: v.deliveryTypes,
        };

        const vehicle = v.id
          ? await tx.vehicle.update({ where: { id: v.id }, data: writeData })
          : await tx.vehicle.create({ data: writeData });

        results.push({
          id: vehicle.id,
          category: vehicle.category,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
        });
      }
      return results;
    };

    // If we received a full PrismaClient, open a transaction. Otherwise the caller
    // is already inside a transaction and we just run inline.
    if ('$transaction' in prisma) {
      return prisma.$transaction((tx) => run(tx));
    }
    return run(prisma);
  },
});
