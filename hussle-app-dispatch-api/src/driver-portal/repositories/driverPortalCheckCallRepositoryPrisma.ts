import type { PrismaClient } from '@prisma/client';

type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export interface CreateDriverCheckCallInput {
  location?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  eta?: Date;
  notes?: string;
}

export interface DriverCheckCallRecord {
  id: string;
  loadId: string;
  location: string | null;
  latitude: unknown;
  longitude: unknown;
  status: string | null;
  eta: Date | null;
  notes: string | null;
  createdAt: Date;
}

export interface DriverPortalCheckCallRepoPort {
  create(loadId: string, input: CreateDriverCheckCallInput): Promise<DriverCheckCallRecord>;
}

export const driverPortalCheckCallRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DriverPortalCheckCallRepoPort => ({
  create: async (loadId, input) =>
    prisma.checkCall.create({
      data: {
        loadId,
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        status: input.status,
        eta: input.eta,
        notes: input.notes,
        brokerNotified: false,
      },
      select: {
        id: true,
        loadId: true,
        location: true,
        latitude: true,
        longitude: true,
        status: true,
        eta: true,
        notes: true,
        createdAt: true,
      },
    }),
});
