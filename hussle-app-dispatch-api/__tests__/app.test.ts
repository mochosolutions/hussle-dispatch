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
process.env['NODE_ENV'] = 'test';

import { createApp } from '../src/app';

describe('createApp', () => {
  it('creates an Express application without throwing', () => {
    expect(() => createApp()).not.toThrow();
  });

  it('returns an object with a listen method', () => {
    const app = createApp();
    expect(typeof app.listen).toBe('function');
  });

  it('registers the health check route', async () => {
    const app = createApp();
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
