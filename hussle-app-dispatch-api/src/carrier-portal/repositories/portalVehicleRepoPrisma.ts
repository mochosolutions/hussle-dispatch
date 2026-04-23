import type { PrismaClient, EquipmentType, VehicleCategory } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

interface CreateVehicleData {
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

interface CreatedVehicleSummary {
  id: string;
  category: VehicleCategory | null;
  make: string | null;
  model: string | null;
  year: number | null;
}

export interface PortalVehicleRepoPort {
  deleteByCarrierId(carrierId: string): Promise<void>;
  createMany(data: CreateVehicleData[]): Promise<CreatedVehicleSummary[]>;
}

export const portalVehicleRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): PortalVehicleRepoPort => ({
  deleteByCarrierId: async (carrierId) => {
    await prisma.vehicle.deleteMany({ where: { carrierId } });
  },

  createMany: async (data) => {
    const results: CreatedVehicleSummary[] = [];
    for (const v of data) {
      const vehicle = await prisma.vehicle.create({ data: v });
      results.push({
        id: vehicle.id,
        category: vehicle.category,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
      });
    }
    return results;
  },
});
