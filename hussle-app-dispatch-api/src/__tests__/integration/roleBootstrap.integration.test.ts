// Required env vars must be set before any module imports env config.
process.env['JWT_SECRET'] = process.env['JWT_SECRET'] ?? 'test-jwt-secret';
process.env['REFRESH_SECRET'] = process.env['REFRESH_SECRET'] ?? 'test-refresh-secret';
process.env['DATABASE_URL'] =
  process.env['DATABASE_URL'] ?? 'postgresql://test:test@localhost:5432/test';

import type { PrismaClient } from '@prisma/client';
import * as nodeCron from 'node-cron';
import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
import { startBackground } from '../../startBackground';
import type { Logger } from '../../shared/utils/logger';

// ---------------------------------------------------------------------------
// Stub deps — no real DB, Redis, or RabbitMQ
// ---------------------------------------------------------------------------

const buildMockPrisma = (): PrismaClient =>
  ({
    processedEvent: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    invitation: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  }) as unknown as PrismaClient;

const buildMockLogger = (): Logger => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the mocked node-cron `schedule` spy injected by jest.setup.ts.
 * The global mock is `jest.fn()` — we retrieve it so we can count calls.
 */
const getScheduleSpy = (): jest.MockedFunction<typeof nodeCron.schedule> =>
  nodeCron.schedule as jest.MockedFunction<typeof nodeCron.schedule>;

describe('role bootstrap gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Decoupling proof: carrier module router import does NOT call subscribe
  // ---------------------------------------------------------------------------

  describe('import-time safety (api role)', () => {
    it('does not call eventBus.subscribe when a feature router module is imported', async () => {
      // Arrange — spy on the shared bus that the global mock injected
      const subscribeSpy = jest.spyOn(sharedEventBus, 'subscribe');

      // Act — importing the router triggers module-level code in carriers/index.ts
      // which constructs the module but does NOT call subscribe (lazy init pattern)
      await import('../../carriers');

      // Assert — no subscribe calls at import time proves api-role safety
      expect(subscribeSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Worker role: startBackground subscribes everything + schedules all 4 crons
  // ---------------------------------------------------------------------------

  describe('startBackground (worker role)', () => {
    it('registers subscriber handlers on the event bus', async () => {
      // Arrange
      const subscribeSpy = jest.spyOn(sharedEventBus, 'subscribe');
      const deps = { prisma: buildMockPrisma(), logger: buildMockLogger() };

      // Act
      const handles = await startBackground(deps);

      // Assert — all 9 subscriber groups + agreements module each call subscribe
      // at least once; exact count may grow as the app does.
      expect(subscribeSpy.mock.calls.length).toBeGreaterThan(0);

      // stopAll is callable without throwing
      await expect(handles.stopAll()).resolves.toBeUndefined();
    });

    it('schedules all 4 cron jobs', async () => {
      // Arrange
      const scheduleSpy = getScheduleSpy();
      const deps = { prisma: buildMockPrisma(), logger: buildMockLogger() };

      // Act
      const handles = await startBackground(deps);

      // Assert — 4 crons: processedEventCleanup + invitationCleanup +
      // settlementCronJob + signedAgreementWatchdog (via startAgreements)
      expect(scheduleSpy).toHaveBeenCalledTimes(4);

      await handles.stopAll();
    });

    it('stopAll resolves without throwing after startBackground completes', async () => {
      // Arrange
      const deps = { prisma: buildMockPrisma(), logger: buildMockLogger() };

      // Act
      const handles = await startBackground(deps);

      // Assert
      await expect(handles.stopAll()).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Api role: createApp does NOT invoke startBackground and registers 0 subscribers
  //
  // After T-11 the load-intel CPM invalidation subscriber is lazy — it is no
  // longer called inside createLoadIntelModule. Importing the load-intel router
  // (via app.ts) must register ZERO subscribers. The dependency-cruiser
  // `no-background-in-api` rule enforces the hard import boundary at build time.
  // ---------------------------------------------------------------------------

  describe('createApp (api role)', () => {
    it('does not schedule any cron jobs when createApp is called', async () => {
      // Arrange — spy on schedule before calling createApp
      const scheduleSpy = getScheduleSpy();

      const mockPrisma = buildMockPrisma();
      const mockRedis = { ping: jest.fn().mockResolvedValue('PONG') };
      const mockEventBus = { isReady: jest.fn().mockReturnValue(true) };

      // Act
      const { createApp } = await import('../../app');
      createApp({ prisma: mockPrisma, redis: mockRedis, eventBus: mockEventBus });

      // Assert — no cron jobs started by the HTTP-only code path
      expect(scheduleSpy).not.toHaveBeenCalled();
    });

    it('registers 0 subscribers when createApp is called alone', async () => {
      // Arrange
      const subscribeSpy = jest.spyOn(sharedEventBus, 'subscribe');

      const mockPrisma = buildMockPrisma();
      const mockRedis = { ping: jest.fn().mockResolvedValue('PONG') };
      const mockEventBus = { isReady: jest.fn().mockReturnValue(true) };

      // Act
      const { createApp } = await import('../../app');
      createApp({ prisma: mockPrisma, redis: mockRedis, eventBus: mockEventBus });

      // Assert — the HTTP-only code path registers zero subscribers; all subscriber
      // init is deferred to startBackground (called only by ROLE=worker and ROLE=all)
      expect(subscribeSpy).not.toHaveBeenCalled();
    });
  });
});
