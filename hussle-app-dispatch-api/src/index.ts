import { env } from './config/env';
// import { runGeoBootstrap } from './config/geoBootstrap';
import { prisma } from './config/database';
import { redisClient } from './shared/redisClient';
import { createApp } from './app';
import { sharedEventBus } from './shared/messaging';
import { logger } from './shared/utils/logger';
import { startBackground } from './startBackground';
import { startWorker } from './worker';
import { startWsGateway } from './startWsGateway';

const isErrorWithMessage = (error: unknown): error is { message: string } =>
  typeof error === 'object' && error !== null && 'message' in error;

/**
 * ROLE=api — HTTP server only, zero subscribers, zero crons.
 *
 * Bus reconciliation: passes `sharedEventBus` to `createApp` for the /health
 * check. All modules use `sharedEventBus` for publishing, so there is a single
 * RabbitMQ connection per process (no split topology).
 */
const startApi = async (): Promise<void> => {
  await redisClient.connect();
  // await runGeoBootstrap(redisClient);

  const app = createApp({ prisma, redis: redisClient, eventBus: sharedEventBus });

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down (api)...');
    await sharedEventBus.close();
    await redisClient.quit();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    shutdown().catch(() => process.exit(1));
  });
  process.on('SIGINT', () => {
    shutdown().catch(() => process.exit(1));
  });

  app.listen(env.PORT, () => {
    logger.info('Server started', { port: env.PORT, role: 'api' });
  });
};

/**
 * ROLE=all (default) — today's behavior: HTTP server + all subscribers + all crons.
 */
const startAll = async (): Promise<void> => {
  await redisClient.connect();
  // await runGeoBootstrap(redisClient);

  const app = createApp({ prisma, redis: redisClient, eventBus: sharedEventBus });

  const backgroundHandles = await startBackground({ prisma, logger });

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down (all)...');
    await backgroundHandles.stopAll();
    await sharedEventBus.close();
    await redisClient.quit();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    shutdown().catch(() => process.exit(1));
  });
  process.on('SIGINT', () => {
    shutdown().catch(() => process.exit(1));
  });

  app.listen(env.PORT, () => {
    logger.info('Server started', { port: env.PORT, role: 'all' });
  });
};

const start = async (): Promise<void> => {
  switch (env.ROLE) {
    case 'api':
      await startApi();
      break;
    case 'worker':
      await startWorker();
      break;
    case 'ws-gateway':
      await startWsGateway();
      break;
    case 'all':
      await startAll();
      break;
  }
};

start().catch((error: unknown) => {
  if (isErrorWithMessage(error)) {
    process.stderr.write(`[startup] Fatal error: ${error.message}\n`);
  }
  process.exit(1);
});
