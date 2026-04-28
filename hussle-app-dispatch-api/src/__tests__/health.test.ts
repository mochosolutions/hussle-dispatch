// Required env vars must be set before any module imports `@/config/env`.
process.env['JWT_SECRET'] = process.env['JWT_SECRET'] ?? 'test-jwt-secret';
process.env['REFRESH_SECRET'] = process.env['REFRESH_SECRET'] ?? 'test-refresh-secret';
process.env['DATABASE_URL'] =
  process.env['DATABASE_URL'] ?? 'postgresql://test:test@localhost:5432/test';

import http from 'http';
import type { PrismaClient } from '@prisma/client';
import type { HealthRedisPort } from '../app';
import { createApp } from '../app';

interface FetchResult {
  status: number;
  body: { status: string; checks: { db: string; redis: string } };
}

const fetchHealth = (baseUrl: string): Promise<FetchResult> =>
  new Promise((resolve, reject) => {
    http
      .get(`${baseUrl}/api/health`, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: res.statusCode ?? 0,
            body: JSON.parse(raw),
          });
        });
      })
      .on('error', reject);
  });

interface StartedApp {
  url: string;
  close: () => Promise<void>;
}

const startServer = async (deps: {
  prisma: PrismaClient;
  redis: HealthRedisPort;
}): Promise<StartedApp> => {
  const app = createApp(deps);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Failed to start test server');
  }
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err !== undefined && err !== null ? reject(err) : resolve()));
      }),
  };
};

const buildPrismaStub = (impl: () => Promise<unknown>): PrismaClient =>
  ({
    $queryRaw: jest.fn().mockImplementation(impl),
  }) as unknown as PrismaClient;

const buildRedisStub = (impl: () => Promise<string>): HealthRedisPort => ({
  ping: jest.fn().mockImplementation(impl),
});

describe('GET /api/health', () => {
  it('returns 200 with both checks ok when prisma and redis succeed', async () => {
    const prisma = buildPrismaStub(async () => [{ '?column?': 1 }]);
    const redis = buildRedisStub(async () => 'PONG');
    const server = await startServer({ prisma, redis });
    try {
      const res = await fetchHealth(server.url);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.checks.db).toBe('ok');
      expect(res.body.checks.redis).toBe('ok');
    } finally {
      await server.close();
    }
  });

  it('returns 503 with db: fail when prisma throws', async () => {
    const prisma = buildPrismaStub(async () => {
      throw new Error('db connection refused');
    });
    const redis = buildRedisStub(async () => 'PONG');
    const server = await startServer({ prisma, redis });
    try {
      const res = await fetchHealth(server.url);

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.checks.db).toBe('fail');
      expect(res.body.checks.redis).toBe('ok');
    } finally {
      await server.close();
    }
  });

  it('returns 503 with redis: fail when redis throws', async () => {
    const prisma = buildPrismaStub(async () => [{ '?column?': 1 }]);
    const redis = buildRedisStub(async () => {
      throw new Error('redis connection refused');
    });
    const server = await startServer({ prisma, redis });
    try {
      const res = await fetchHealth(server.url);

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.checks.db).toBe('ok');
      expect(res.body.checks.redis).toBe('fail');
    } finally {
      await server.close();
    }
  });
});
