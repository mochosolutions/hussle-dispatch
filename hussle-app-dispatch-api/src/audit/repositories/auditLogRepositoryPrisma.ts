/**
 * Audit Log Repository - Prisma Implementation
 *
 * Implements AuditLogRepoPort with tenant isolation.
 * All queries are scoped to the provided organizationId.
 */

import { Prisma } from '@prisma/client';
import type { PrismaClient, AuditLog } from '@prisma/client';
import type {
  AuditLogRepoPort,
  CreateAuditLogInput,
  AuditLogQueryOptions,
} from '../types/auditTypes';

export const auditLogRepositoryPrisma = (
  prisma: PrismaClient,
  organizationId: string,
): AuditLogRepoPort => ({
  create: async (input: CreateAuditLogInput): Promise<AuditLog> =>
    prisma.auditLog.create({
      data: {
        userId: input.userId,
        organizationId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        changes: (input.changes ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,
        metadata: (input.metadata ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,
        timestamp: input.timestamp ?? new Date(),
      },
    }),

  findByEntity: async (
    entityType: string,
    entityId: string,
    options: AuditLogQueryOptions = {},
  ): Promise<AuditLog[]> => {
    const { limit = 100, offset = 0, action, startTime, endTime } = options;

    return prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType,
        entityId,
        ...(action && { action }),
        ...(startTime && { timestamp: { gte: startTime } }),
        ...(endTime && { timestamp: { lte: endTime } }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  },

  findByUser: async (
    userId: string,
    options: AuditLogQueryOptions = {},
  ): Promise<AuditLog[]> => {
    const { limit = 100, offset = 0, action, startTime, endTime } = options;

    return prisma.auditLog.findMany({
      where: {
        organizationId,
        userId,
        ...(action && { action }),
        ...(startTime && { timestamp: { gte: startTime } }),
        ...(endTime && { timestamp: { lte: endTime } }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  },

  findRecent: async (options: AuditLogQueryOptions = {}): Promise<AuditLog[]> => {
    const { limit = 50, offset = 0, action, startTime, endTime } = options;

    return prisma.auditLog.findMany({
      where: {
        organizationId,
        ...(action && { action }),
        ...(startTime && { timestamp: { gte: startTime } }),
        ...(endTime && { timestamp: { lte: endTime } }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  },
});
