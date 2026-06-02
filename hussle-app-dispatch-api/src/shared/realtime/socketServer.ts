import type { Server as HttpServer } from 'http';

import { createAdapter } from '@socket.io/redis-adapter';
import type { Redis } from 'ioredis';
import { Server } from 'socket.io';

import { env } from '@/config/env';
import { ROLES } from '@/config/roles';
import type { Logger } from '@/shared/utils/logger';

import type { SocketSessionData } from './socketAuth';
import { createSocketAuthMiddleware } from './socketAuth';

/**
 * Resolves the Driver.id for an authenticated DRIVER user. Injected so the
 * realtime layer never imports Prisma directly. Returns null when no driver
 * row is linked to the user.
 */
export interface DriverLookupPort {
  findDriverIdByUserId(userId: string): Promise<string | null>;
}

interface SocketServerDeps {
  redis: Redis;
  logger: Logger;
  driverLookup: DriverLookupPort;
}

export interface SocketServerHandle {
  io: Server;
  relayToOrg: (organizationId: string, eventName: string, payload: unknown) => void;
  relayToDriver: (driverId: string, eventName: string, payload: unknown) => void;
  close: () => Promise<void>;
}

const orgRoom = (organizationId: string): string => `org:${organizationId}`;
const driverRoom = (driverId: string): string => `driver:${driverId}`;

/**
 * Builds the socket.io server for the ws-gateway role: Redis-adapter backed
 * (so room emits fan out across replicas), cookie-JWT authenticated, and
 * room-scoped by the server-trusted session.
 *
 * Room assignment is derived ONLY from `socket.data` (set by socketAuth from
 * the verified session) — never from client handshake input:
 *  - ADMIN / DISPATCHER join `org:<organizationId>`.
 *  - DRIVER joins `driver:<driverId>` (resolved via Driver.userId) and is
 *    NEVER placed in an org room.
 */
export const createSocketServer = (
  httpServer: HttpServer,
  deps: SocketServerDeps,
): SocketServerHandle => {
  const io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  });

  const pubClient = deps.redis.duplicate();
  const subClient = deps.redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use(createSocketAuthMiddleware({ redis: deps.redis, logger: deps.logger }));

  io.on('connection', (socket) => {
    const session = socket.data as SocketSessionData;

    if (session.role === ROLES.ADMIN || session.role === ROLES.DISPATCHER) {
      socket.join(orgRoom(session.organizationId));
      return;
    }

    // DRIVER branch (US-09): driver sockets join their own driver room ONLY,
    // resolved from the verified user — never an org room.
    if (session.role === ROLES.DRIVER) {
      deps.driverLookup
        .findDriverIdByUserId(session.userId)
        .then((driverId) => {
          if (driverId === null) {
            deps.logger.warn('Driver socket has no linked driver row', {
              userId: session.userId,
            });
            socket.disconnect(true);
            return;
          }
          socket.join(driverRoom(driverId));
        })
        .catch((error: unknown) => {
          deps.logger.error('Driver room resolution failed', {
            userId: session.userId,
            error: error instanceof Error ? error.message : String(error),
          });
          socket.disconnect(true);
        });
      return;
    }

    // Any other role (e.g. VIEWER) gets no room and therefore no events.
  });

  const relayToOrg = (organizationId: string, eventName: string, payload: unknown): void => {
    io.to(orgRoom(organizationId)).emit(eventName, payload);
  };

  const relayToDriver = (driverId: string, eventName: string, payload: unknown): void => {
    io.to(driverRoom(driverId)).emit(eventName, payload);
  };

  const close = async (): Promise<void> => {
    await io.close();
    pubClient.disconnect();
    subClient.disconnect();
  };

  return { io, relayToOrg, relayToDriver, close };
};
