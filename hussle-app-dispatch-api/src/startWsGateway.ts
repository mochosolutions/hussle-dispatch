import 'express-async-errors';
import { createServer } from 'http';

import express, { type Request, type Response } from 'express';

import { env } from './config/env';
import { prisma } from './config/database';
import { redisClient } from './shared/redisClient';
import { createPrismaMessageDedup, createRabbitMqEventBus } from './shared/messaging';
import { createDriverLookupPrisma } from './shared/realtime/driverLookupPrisma';
import { createSocketServer } from './shared/realtime/socketServer';
import { createWsGatewaySubscriber } from './shared/realtime/wsGatewaySubscriber';
import { logger } from './shared/utils/logger';

type CheckStatus = 'ok' | 'fail';

interface HealthCheckResult {
  status: 'ok' | 'degraded';
  checks: { db: CheckStatus; redis: CheckStatus; eventBus: CheckStatus; socket: CheckStatus };
}

const { WS_GATEWAY_HEALTH_PORT, WS_GATEWAY_PORT } = env;

/**
 * Boot sequence for ROLE=ws-gateway.
 *
 * Connects Redis, constructs the event bus, stands up a socket.io server (Redis
 * adapter, cookie-JWT auth, org/driver rooms) on its own HTTP listener, wires
 * the ws-gateway bus subscriber (queue group `ws-gateway`) to relay load events
 * into rooms, and exposes a minimal `/health` probe. Holds sockets only — never
 * mounts app routers, subscribers, or crons.
 */
export const startWsGateway = async (): Promise<void> => {
  await redisClient.connect();

  const eventBus = createRabbitMqEventBus(
    env.RABBITMQ_URL,
    logger,
    createPrismaMessageDedup(prisma),
  );

  const socketHttpServer = createServer();
  const socketServer = createSocketServer(socketHttpServer, {
    redis: redisClient,
    logger,
    driverLookup: createDriverLookupPrisma(prisma),
  });

  await createWsGatewaySubscriber({ eventBus, socketServer, logger });

  let socketListening = false;
  socketHttpServer.listen(WS_GATEWAY_PORT, () => {
    socketListening = true;
    logger.info('ws-gateway socket server started', { port: WS_GATEWAY_PORT });
  });

  // Minimal health server — no app routers, just the health probe
  const healthApp = express();

  healthApp.get('/health', async (_req: Request, res: Response) => {
    const [dbResult, redisResult] = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      redisClient.ping(),
    ]);

    const result: HealthCheckResult = {
      status: 'ok',
      checks: {
        db: dbResult.status === 'fulfilled' ? 'ok' : 'fail',
        redis: redisResult.status === 'fulfilled' ? 'ok' : 'fail',
        eventBus: eventBus.isReady() ? 'ok' : 'fail',
        socket: socketListening ? 'ok' : 'fail',
      },
    };

    const anyFailed = Object.values(result.checks).some((status) => status === 'fail');
    if (anyFailed) {
      result.status = 'degraded';
      res.status(503).json(result);
      return;
    }

    res.status(200).json(result);
  });

  healthApp.listen(WS_GATEWAY_HEALTH_PORT, () => {
    logger.info('ws-gateway health server started', { port: WS_GATEWAY_HEALTH_PORT });
  });

  logger.info('ws-gateway started', { role: 'ws-gateway' });

  const shutdown = async (): Promise<void> => {
    logger.info('ws-gateway shutting down...');
    await socketServer.close();
    await eventBus.close();
    await redisClient.quit();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    shutdown().catch(() => process.exit(1));
  });
  process.on('SIGINT', () => {
    shutdown().catch(() => process.exit(1));
  });
};
