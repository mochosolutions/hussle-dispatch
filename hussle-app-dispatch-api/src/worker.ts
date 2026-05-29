import 'express-async-errors';
import express, { type Request, type Response } from 'express';

import { env } from './config/env';
import { prisma } from './config/database';
import { redisClient } from './shared/redisClient';
import { createPrismaMessageDedup, createRabbitMqEventBus } from './shared/messaging';
import { logger } from './shared/utils/logger';
import { startBackground } from './startBackground';

type CheckStatus = 'ok' | 'fail';

interface HealthCheckResult {
  status: 'ok' | 'degraded';
  checks: { db: CheckStatus; redis: CheckStatus; eventBus: CheckStatus };
}

const { WORKER_HEALTH_PORT } = env;

/**
 * Boot sequence for ROLE=worker.
 *
 * Connects Redis, constructs the event bus (consumer + publisher), starts all
 * 12 subscriber groups and all 4 cron jobs via `startBackground`, and exposes
 * a minimal `/health` server for orchestrator healthchecks.
 *
 * The bus is constructed here (same `createRabbitMqEventBus` path used by
 * ROLE=api via `src/index.ts`) so both roles connect to the same broker/topology.
 * `sharedEventBus` is the singleton that module `index.ts` files reference; it
 * is initialized from the same `RABBITMQ_URL` env var, so no split topology.
 */
export const startWorker = async (): Promise<void> => {
  await redisClient.connect();

  const eventBus = createRabbitMqEventBus(
    env.RABBITMQ_URL,
    logger,
    createPrismaMessageDedup(prisma),
  );

  const backgroundHandles = await startBackground({ prisma, logger });

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

  healthApp.listen(WORKER_HEALTH_PORT, () => {
    logger.info('Worker health server started', { port: WORKER_HEALTH_PORT });
  });

  logger.info('Worker started', { role: 'worker' });

  const shutdown = async (): Promise<void> => {
    logger.info('Worker shutting down...');
    await backgroundHandles.stopAll();
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
