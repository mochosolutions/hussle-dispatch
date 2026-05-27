/**
 * Smoke test — verifies the Express app instantiates without errors.
 * Database connection is NOT required for this test.
 */

// Mock the Prisma client so no real DB connection is made
jest.mock('../src/config/database', () => ({
  prisma: {},
}));

// Mock env so DATABASE_URL requirement is satisfied
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test';
process.env['JWT_SECRET'] = process.env['JWT_SECRET'] ?? 'test-jwt-secret';
process.env['REFRESH_SECRET'] = process.env['REFRESH_SECRET'] ?? 'test-refresh-secret';
process.env['NODE_ENV'] = 'test';

import type { PrismaClient } from '@prisma/client';
import type { HealthRedisPort } from '../src/app';
import { createApp } from '../src/app';

const buildDeps = (): { prisma: PrismaClient; redis: HealthRedisPort } => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  } as unknown as PrismaClient,
  redis: {
    ping: jest.fn().mockResolvedValue('PONG'),
  },
});

describe('createApp', () => {
  it('creates an Express application without throwing', () => {
    expect(() => createApp(buildDeps())).not.toThrow();
  });

  it('returns an object with a listen method', () => {
    const app = createApp(buildDeps());
    expect(typeof app.listen).toBe('function');
  });

  it('registers the health check route', async () => {
    const app = createApp(buildDeps());
    const routes: string[] = [];

    // Walk the router stack to find registered paths
    type LayerWithRoute = { route?: { path: string } };
    const stack = (app._router?.stack ?? []) as LayerWithRoute[];
    stack.forEach((layer) => {
      if (layer.route) {
        routes.push(layer.route.path);
      }
    });

    expect(routes).toContain('/api/health');
  });
});
