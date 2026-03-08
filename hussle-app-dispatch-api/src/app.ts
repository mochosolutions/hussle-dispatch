import 'express-async-errors';
import Decimal from 'decimal.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { rootAuthRouter } from './auth';
import { carriersRouter } from './carriers';
// import { contactsRouter } from './contacts';
import { driversRouter } from './drivers';
import { vehiclesRouter } from './vehicles';
import { errorHandler } from './shared/middleware/errorHandler';

/**
 * JSON replacer that serializes Decimal.js instances as strings.
 * This ensures financial values are never silently truncated by JSON number precision.
 * Acceptance criterion: "Decimals in API responses serialized as strings in JSON."
 */
const decimalReplacer = (_key: string, value: unknown): unknown => {
  if (value instanceof Decimal) {
    return value.toFixed();
  }
  return value;
};

export const createApp = (): express.Application => {
  const app = express();

  // Serialize Decimal.js instances as strings in all JSON responses
  app.set('json replacer', decimalReplacer);

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors());

  // Request logging (disabled in test environment)
  if (process.env['NODE_ENV'] !== 'development') {
    app.use(morgan('combined'));
  }

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Cookie parsing (auth reads tokens from HttpOnly cookies)
  app.use(cookieParser());

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'hussle-app-dispatch-api' });
  });

  // Auth routes
  app.use(rootAuthRouter);

  // // Feature routes mount here (added by each feature story)
  app.use('/api/v1/carriers', carriersRouter);
  // app.use('/api/v1/contacts', contactsRouter);
  app.use('/api/v1/drivers', driversRouter);
  app.use('/api/v1/vehicles', vehiclesRouter);

  // Centralized error handler — must be last
  app.use(errorHandler);

  return app;
};
