import type { ApprovalStatus, PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  AccessorialRepoPort,
  CreateAccessorialInput,
  UpdateAccessorialInput,
  UpdateApprovalInput,
} from '../types/accessorialTypes';
import { NotFoundError } from '@/shared/errors';

export const accessorialRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): AccessorialRepoPort => ({
  create: async (input) => {
    const { organizationId: _organizationId, approvalStatus, ...chargeData } = input;

    return prisma.accessorialCharge.create({
      data: {
        ...chargeData,
        ...(approvalStatus !== undefined && {
          approvalStatus: approvalStatus as ApprovalStatus,
        }),
      },
    });
  },

  update: async (input) => {
    const { id, organizationId, approvalStatus, ...updateData } = input;

    const existing = await prisma.accessorialCharge.findFirst({
      where: {
        id,
        load: { organizationId },
      },
    });

    if (existing === null) {
      throw new NotFoundError(`Accessorial charge ${id} not found`);
    }

    return prisma.accessorialCharge.update({
      where: { id },
      data: {
        ...updateData,
        ...(approvalStatus !== undefined && {
          approvalStatus: approvalStatus as ApprovalStatus,
        }),
      },
    });
  },

  updateApproval: async (input: UpdateApprovalInput) =>
    prisma.accessorialCharge.update({
      where: { id: input.id },
      data: {
        approvalStatus: input.approvalStatus as ApprovalStatus,
        approvalSource: input.approvalSource,
        approvalNotes: input.approvalNotes,
        documentId: input.documentId,
      },
    }),

  delete: async (id, organizationId) => {
    const existing = await prisma.accessorialCharge.findFirst({
      where: {
        id,
        load: { organizationId },
      },
    });

    if (existing === null) {
      throw new NotFoundError(`Accessorial charge ${id} not found`);
    }

    await prisma.accessorialCharge.delete({ where: { id } });
  },

  findByLoadId: async (loadId, organizationId) => {
    return prisma.accessorialCharge.findMany({
      where: {
        loadId,
        load: { organizationId },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  findById: async (id, organizationId) => {
    return prisma.accessorialCharge.findFirst({
      where: {
        id,
        load: { organizationId },
      },
    });
  },
});
