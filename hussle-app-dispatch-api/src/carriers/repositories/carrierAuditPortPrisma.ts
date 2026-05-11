import type { Prisma, PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { CarrierAuditPort } from '../types/carrierAuditPort';

export const carrierAuditPortPrisma = (
  prismaClient: PrismaClient | PrismaTransaction,
): CarrierAuditPort => ({
  create: (organizationId, input) =>
    prismaClient.auditLog.create({
      data: {
        organizationId,
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        changes: input.changes as unknown as Prisma.InputJsonValue,
        metadata: input.metadata as unknown as Prisma.InputJsonValue,
        timestamp: new Date(),
      },
    }),
});
