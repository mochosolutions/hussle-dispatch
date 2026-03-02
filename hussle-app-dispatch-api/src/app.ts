import 'express-async-errors';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './shared/middleware/errorHandler';

export const createApp = (): express.Application => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors());

  // Request logging (disabled in test environment)
  if (process.env['NODE_ENV'] !== 'test') {
    app.use(morgan('combined'));
  }

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hussle-app-dispatch-api' });
  });

  // Feature routes mount here (added by each feature story)
  // e.g. app.use('/api/v1/carriers', carriersRouter);

  // Centralized error handler — must be last
  app.use(errorHandler);

  return app;
};
