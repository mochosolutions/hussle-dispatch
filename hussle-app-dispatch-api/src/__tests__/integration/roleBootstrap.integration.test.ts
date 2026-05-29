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
  // Api role: createApp does NOT invoke startBackground
  //
  // Note: app.ts imports the loadIntelRouter which eagerly registers a CPM
  // invalidation subscriber inside createLoadIntelModule (a pre-existing
  // violation in load-intel/compositionRoot.ts). The critical constraint
  // enforced here is that app.ts does NOT call startBackground — the full
  // subscriber + cron orchestrator — so the HTTP-only role never starts the
  // worker machinery. The dependency-cruiser `no-background-in-api` rule
  // (T-07) enforces the hard import boundary at build time.
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

    it('registers fewer subscribers than startBackground when createApp is called alone', async () => {
      // Arrange — count subscribe calls from createApp alone
      const subscribeSpy = jest.spyOn(sharedEventBus, 'subscribe');

      const mockPrisma = buildMockPrisma();
      const mockRedis = { ping: jest.fn().mockResolvedValue('PONG') };
      const mockEventBus = { isReady: jest.fn().mockReturnValue(true) };

      const { createApp } = await import('../../app');
      createApp({ prisma: mockPrisma, redis: mockRedis, eventBus: mockEventBus });
      const countFromCreateApp = subscribeSpy.mock.calls.length;

      jest.clearAllMocks();

      // Count subscribe calls from startBackground
      const deps = { prisma: buildMockPrisma(), logger: buildMockLogger() };
      const handles = await startBackground(deps);
      const countFromStartBackground = subscribeSpy.mock.calls.length;

      await handles.stopAll();

      // Assert — startBackground registers far more subscribers than createApp alone
      // (createApp only has the pre-existing load-intel eager subscriber;
      //  startBackground wires all 9+ subscriber groups)
      expect(countFromStartBackground).toBeGreaterThan(countFromCreateApp);
    });
  });
});
