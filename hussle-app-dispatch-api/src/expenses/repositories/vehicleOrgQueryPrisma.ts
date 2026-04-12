import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import { NotFoundError } from '@/shared/errors/commonErrors';

export interface VehicleOrgQueryPort {
  findOrganizationId(vehicleId: string): Promise<string>;
}

export const vehicleOrgQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): VehicleOrgQueryPort => ({
  findOrganizationId: async (vehicleId: string): Promise<string> => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        carrier: {
          select: { managedByOrgId: true },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundError(`Vehicle ${vehicleId} not found`);
    }

    return vehicle.carrier.managedByOrgId;
  },
});
