import { env } from './config/env';
import { createApp } from './app';

const app = createApp();

app.listen(env.PORT, () => {
  process.stdout.write(`[hussle-app-dispatch-api] Listening on port ${env.PORT}\n`);
});
