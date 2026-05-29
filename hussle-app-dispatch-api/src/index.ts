import { env } from './config/env';
// import { runGeoBootstrap } from './config/geoBootstrap';
import { prisma } from './config/database';
import { redisClient } from './shared/redisClient';
import { createApp } from './app';
import { createPrismaMessageDedup, createRabbitMqEventBus } from './shared/messaging';
import { createProcessedEventCleanup } from './shared/messaging/processedEventCleanup';
import { logger } from './shared/utils/logger';
import { stopAgreements } from './agreements';

const start = async (): Promise<void> => {
  await redisClient.connect();
  // await runGeoBootstrap(redisClient);

  const eventBus = createRabbitMqEventBus(
    env.RABBITMQ_URL,
    logger,
    createPrismaMessageDedup(prisma),
  );

  const app = createApp({ prisma, redis: redisClient, eventBus });

  const processedEventCleanup = createProcessedEventCleanup({ prisma, logger });
  processedEventCleanup.start();

  // Graceful shutdown: close event bus on SIGTERM/SIGINT
  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down...');
    stopAgreements();
    processedEventCleanup.stop();
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

  app.listen(env.PORT, () => {
    logger.info('Server started', { port: env.PORT, eventBus: 'rabbitmq' });
  });
};

start().catch((error: unknown) => {
  if (isErrorWithMessage(error)) {
    process.stderr.write(`[startup] Fatal error: ${error.message}\n`);
  }
  process.exit(1);
});

const isErrorWithMessage = (error: unknown): error is { message: string } =>
  typeof error === 'object' && error !== null && 'message' in error;
