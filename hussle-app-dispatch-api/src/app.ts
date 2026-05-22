import 'express-async-errors';
import Decimal from 'decimal.js';
import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import type { PrismaClient } from '@prisma/client';
import { apiKeyRouter } from './api-keys';
import { rootAuthRouter } from './auth';
import { carriersRouter } from './carriers';
import { contactsRouter } from './contacts';
import { customersRouter } from './customers';
import { documentsRouter } from './documents';
import { driversRouter } from './drivers';
import { loadsRouter } from './loads';
import { placesRouter } from './places';
import { vehiclesRouter } from './vehicles';
import { loadIntelRouter } from './load-intel';
import { loadBoardRouter } from './load-board';
import { invoicesRouter } from './invoices';
import { notificationsRouter } from './notifications';
import { dashboardRouter } from './dashboard';
import { settingsRouter } from './settings';
import { mapsRouter } from './maps';
import { driverPortalRouter } from './driver-portal';
import { carrierPortalRouter } from './carrier-portal';
import { expensesRouter, recurringExpensesRouter, driverPortalExpensesRouter } from './expenses';
import { iftaRouter } from './ifta';
import { settlementsRouter } from './settlements';

// Side-effect imports: initialize subscribers on startup
import './audit';
import './notifications';
import '@/shared/fmcsa';
import { agreementsRouter, docusealWebhookRouter } from './agreements';
import { smsPromptsRouter } from './sms-prompts';
import { shortLinksRouter } from './short-links';
import { env } from './config/env';
import { csrfProtection } from './shared/middleware/csrfProtection';
import { errorHandler } from './shared/middleware/errorHandler';
import { createStorageProvider } from './shared/storage';
import { mountLocalStorageRoutes } from './shared/storage/localStorageRoutes';
import { logger } from './shared/utils/logger';
import { configureSecurity } from './shared/middleware/security';

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

/**
 * Minimal port for the Redis client used by the health check. Avoids tying
 * `app.ts` to the concrete `ioredis` implementation while keeping the test
 * surface small (only `ping` is required).
 */
export interface HealthRedisPort {
  ping: () => Promise<string>;
}

/**
 * Minimal port for the event bus used by the health check. Synchronous so the
 * probe stays cheap — implementations report the cached broker-connection
 * state, not a fresh network round-trip.
 */
export interface HealthEventBusPort {
  isReady: () => boolean;
}

export interface CreateAppDeps {
  prisma: PrismaClient;
  redis: HealthRedisPort;
  eventBus: HealthEventBusPort;
}

type CheckStatus = 'ok' | 'fail';

interface HealthCheckResult {
  status: 'ok' | 'degraded';
  checks: { db: CheckStatus; redis: CheckStatus; eventBus: CheckStatus };
}

export const createApp = (deps: CreateAppDeps): express.Application => {
  const app = express();

  // Serialize Decimal.js instances as strings in all JSON responses
  app.set('json replacer', decimalReplacer);

  // Health check — pings DB + Redis + RabbitMQ so the orchestrator can detect dependency outages
  app.get('/api/health', async (_req: Request, res: Response) => {
    const [dbResult, redisResult] = await Promise.allSettled([
      deps.prisma.$queryRaw`SELECT 1`,
      deps.redis.ping(),
    ]);

    const result: HealthCheckResult = {
      status: 'ok',
      checks: {
        db: dbResult.status === 'fulfilled' ? 'ok' : 'fail',
        redis: redisResult.status === 'fulfilled' ? 'ok' : 'fail',
        eventBus: deps.eventBus.isReady() ? 'ok' : 'fail',
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

  configureSecurity(app);

  // Request logging (disabled in test environment)
  if (process.env['NODE_ENV'] !== 'development') {
    app.use(morgan('combined'));
  }

  // Body parsing — 2MB limit to accommodate large load-board ingest payloads
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Cookie parsing (auth reads tokens from HttpOnly cookies)
  app.use(cookieParser());

  // CSRF double-submit-cookie protection — must come after cookieParser so we
  // can read csrfToken; exempts public auth + webhook paths internally.
  app.use(csrfProtection);

  // Auth routes
  app.use(rootAuthRouter);

  // Public short-link redirect — mounted outside /api/v1 (no auth required)
  app.use('/s', shortLinksRouter);

  // // Feature routes mount here (added by each feature story)
  app.use('/api/v1/api-keys', apiKeyRouter);
  app.use('/api/v1/agreements', agreementsRouter);
  app.use('/api/v1/carriers', carriersRouter);
  app.use('/api/v1/contacts', contactsRouter);
  app.use('/api/v1/customers', customersRouter);
  app.use('/api/v1/documents', documentsRouter);
  app.use('/api/v1/drivers', driversRouter);
  app.use('/api/v1/places', placesRouter);
  app.use('/api/v1/loads', loadsRouter);
  app.use('/api/v1/loads', smsPromptsRouter);
  app.use('/api/v1/vehicles', vehiclesRouter);
  app.use('/api/v1/load-intel', loadIntelRouter);
  app.use('/api/v1/load-board', loadBoardRouter);
  app.use('/api/v1/invoices', invoicesRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/maps', mapsRouter);
  app.use('/api/v1/driver-portal', driverPortalRouter);
  app.use('/api/v1/carrier-portal', carrierPortalRouter);
  app.use('/api/v1/expenses', expensesRouter);
  app.use('/api/v1/recurring-expenses', recurringExpensesRouter);
  app.use('/api/v1/driver-portal/expenses', driverPortalExpensesRouter);
  app.use('/api/v1/ifta', iftaRouter);
  app.use('/api/v1/settlements', settlementsRouter);

  // Local storage file-serving route (dev/test only)
  if (env.STORAGE_BACKEND === 'local') {
    const storageProvider = createStorageProvider(
      {
        backend: 'local',
        basePath: env.STORAGE_LOCAL_PATH,
        baseUrl: '/api/v1/storage',
      },
      logger,
    );
    mountLocalStorageRoutes(app, storageProvider);
  }

  // Public DocuSeal webhook — mounted outside /api/v1 (HMAC-verified, no auth)
  app.use('/webhooks', docusealWebhookRouter);

  // Centralized error handler — must be last
  app.use(errorHandler);

  return app;
};
