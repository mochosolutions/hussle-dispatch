import { env } from './config/env';
// import { runGeoBootstrap } from './config/geoBootstrap';
// import { redisClient } from './shared/redisClient';
import { createApp } from './app';

const start = async (): Promise<void> => {
  // await redisClient.connect();
  // await runGeoBootstrap(redisClient);

  const app = createApp();

  app.listen(env.PORT, () => {
    process.stdout.write(`[hussle-app-dispatch-api] Listening on port ${env.PORT}\n`);
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
