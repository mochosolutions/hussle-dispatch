import type { PrismaClient, TrackingTokenType } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  TrackingTokenRepoPort,
  TrackingLoadQueryPort,
} from '../types/trackingTokenTypes';

export const trackingTokenRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): TrackingTokenRepoPort => ({
  create: async (input) =>
    prisma.loadTrackingToken.create({
      data: {
        loadId: input.loadId,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        token: input.token,
        expiresAt: input.expiresAt,
        type: input.type ?? 'CUSTOMER',
      },
    }),

  findByToken: async (token) =>
    prisma.loadTrackingToken.findUnique({
      where: { token },
    }),

  findActiveByLoadId: async (loadId: string, type?: TrackingTokenType) =>
    prisma.loadTrackingToken.findFirst({
      where: {
        loadId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        ...(type !== undefined && { type }),
      },
      orderBy: { createdAt: 'desc' },
    }),

  revoke: async (id) => {
    await prisma.loadTrackingToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },
});

export const trackingLoadQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): TrackingLoadQueryPort => ({
  findTrackingSummary: async (loadId) => {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
          take: 10,
        },
        checkCalls: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (load === null) {
      return null;
    }

    const pickupStop = load.stops.find((s) => s.type === 'PICKUP');
    const deliveryStop = [...load.stops].reverse().find((s) => s.type === 'DELIVERY');
    const lastCheckCall = load.checkCalls[0] ?? null;

    return {
      loadNumber: load.loadNumber,
      status: load.status,
      originCity: pickupStop?.city ?? null,
      originState: pickupStop?.state ?? null,
      destinationCity: deliveryStop?.city ?? null,
      destinationState: deliveryStop?.state ?? null,
      eta: lastCheckCall?.eta?.toISOString() ?? null,
      lastCheckCallLocation: lastCheckCall?.location ?? null,
      lastCheckCallTime: lastCheckCall?.createdAt.toISOString() ?? null,
    };
  },
});
