import type { PrismaClient, Carrier } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import { ForbiddenError, NotFoundError } from '@/shared/errors/commonErrors';

export interface PortalCarrierRepoPort {
  findByIdScoped(carrierId: string, organizationId: string): Promise<Carrier>;
  update(carrierId: string, organizationId: string, data: Record<string, unknown>): Promise<Carrier>;
  findCostProfile(
    carrierId: string,
    organizationId: string,
  ): Promise<{ id: string; dispatchFeePercent: number; costProfileVersion: number } | null>;
  updateCostProfile(
    carrierId: string,
    organizationId: string,
    data: { minimumRatePerMile: number; costProfileVersion: number; costProfileSource: string },
  ): Promise<void>;
  updateComplianceFlags(
    carrierId: string,
    organizationId: string,
    flags: Record<string, unknown>,
  ): Promise<void>;
}

export const portalCarrierRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): PortalCarrierRepoPort => {
  const verifyOwnership = async (carrierId: string, organizationId: string): Promise<Carrier> => {
    const carrier = await prisma.carrier.findUnique({ where: { id: carrierId } });

    if (!carrier) {
      throw new NotFoundError(`Carrier with id ${carrierId} not found`);
    }

    if (carrier.managedByOrgId !== organizationId) {
      throw new ForbiddenError('Carrier does not belong to this organization');
    }

    return carrier;
  };

  return {
    findByIdScoped: (carrierId, organizationId) => verifyOwnership(carrierId, organizationId),

    update: async (carrierId, organizationId, data) => {
      await verifyOwnership(carrierId, organizationId);
      return prisma.carrier.update({ where: { id: carrierId }, data });
    },

    findCostProfile: async (carrierId, organizationId) => {
      const carrier = await verifyOwnership(carrierId, organizationId);
      return {
        id: carrier.id,
        dispatchFeePercent: Number(carrier.dispatchFeePercent ?? 0),
        costProfileVersion: carrier.costProfileVersion ?? 0,
      };
    },

    updateCostProfile: async (carrierId, organizationId, data) => {
      await verifyOwnership(carrierId, organizationId);
      await prisma.carrier.update({
        where: { id: carrierId },
        data: {
          minimumRatePerMile: data.minimumRatePerMile,
          costProfileVersion: data.costProfileVersion,
          costProfileSource: data.costProfileSource,
        },
      });
    },

    updateComplianceFlags: async (carrierId, organizationId, flags) => {
      await verifyOwnership(carrierId, organizationId);
      await prisma.carrier.update({
        where: { id: carrierId },
        data: flags,
      });
    },
  };
};
